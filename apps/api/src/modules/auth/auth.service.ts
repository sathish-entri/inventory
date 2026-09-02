import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "@inventra/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { EMAIL_PROVIDER, EmailProvider } from "../integrations/providers";
import { Inject } from "@nestjs/common";
import { LoginDto, RegisterDto } from "./dto";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  async register(dto: RegisterDto) {
    const rounds = Number(this.config.get("BCRYPT_ROUNDS", 12));
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    let slug = slugify(dto.organizationName);
    const clash = await this.prisma.organization.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${randomBytes(2).toString("hex")}`;

    const result = await this.prisma.$transaction(
      async (tx: any) => {
        const organization = await tx.organization.create({
          data: { name: dto.organizationName, slug },
        });
        await this.ensurePermissions(tx);
        const roles = await this.seedRoles(tx, organization.id);
        const user = await tx.user.create({
          data: {
            organizationId: organization.id,
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
        const admin = roles.find((r: any) => r.name === "Admin");
        if (admin) {
          await tx.userRole.create({
            data: { userId: user.id, roleId: admin.id },
          });
        }
        return { user, organization };
      },
      { timeout: 60000 },
    );

    const verifyToken = randomBytes(32).toString("hex");
    await this.prisma.passwordReset.create({
      data: {
        userId: result.user.id,
        tokenHash: sha256(`verify:${verifyToken}`),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await this.email.send(
      dto.email,
      "Verify your Inventra account",
      `<p>Verification token: ${verifyToken}</p>`,
    );

    return this.issueTokens(result.user.id, result.organization.id, dto.email.toLowerCase());
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const email = dto.email.toLowerCase();
    const users = await this.prisma.user.findMany({
      where: {
        email,
        ...(dto.organizationSlug
          ? { organization: { slug: dto.organizationSlug } }
          : {}),
      },
      include: { organization: true },
    });
    if (users.length !== 1) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const user = users[0];
    if (!user.isActive) throw new UnauthorizedException("Account disabled");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueTokens(user.id, user.organizationId, user.email, meta);
  }

  async refresh(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(stored.userId, stored.organizationId, stored.user.email);
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedById: "rotated" },
    });
    return tokens;
  }

  async logout(refreshToken: string | undefined, userId: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(refreshToken), userId },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return { success: true };
    const token = randomBytes(32).toString("hex");
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
    await this.email.send(email, "Reset your password", `<p>Reset token: ${token}</p>`);
    return { success: true };
  }

  async resetPassword(token: string, password: string) {
    const row = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired token");
    }
    const rounds = Number(this.config.get("BCRYPT_ROUNDS", 12));
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await bcrypt.hash(password, rounds) },
      }),
      this.prisma.passwordReset.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  async verifyEmail(token: string) {
    const row = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(`verify:${token}`) },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired verification token");
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ]);
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        organization: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    const { passwordHash: _, ...safe } = user;
    return {
      ...safe,
      permissions: user.roles.flatMap((ur: any) => ur.role.permissions.map((p: any) => p.permission.key)),
    };
  }

  private async issueTokens(
    userId: string,
    organizationId: string,
    email: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const permissions = await this.loadPermissions(userId);
    const accessToken = await this.jwt.signAsync(
      { sub: userId, orgId: organizationId, email, permissions },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN", "15m"),
      },
    );
    const refreshRaw = randomBytes(48).toString("hex");
    const days = 7;
    await this.prisma.refreshToken.create({
      data: {
        organizationId,
        userId,
        tokenHash: sha256(refreshRaw),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });
    return { accessToken, refreshToken: refreshRaw, tokenType: "Bearer" as const };
  }

  private async loadPermissions(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    return [...new Set(roles.flatMap((r: any) => r.role.permissions.map((p: any) => p.permission.key)))] as string[];
  }

  private async ensurePermissions(tx: any) {
    const existing = await tx.permission.findMany({ select: { key: true } });
    const existingKeys = new Set(existing.map((p: any) => p.key));
    const missing = PERMISSIONS.filter((key) => !existingKeys.has(key));
    if (missing.length > 0) {
      await tx.permission.createMany({
        data: missing.map((key) => ({ key })),
      });
    }
  }

  async seedRoles(tx: any, organizationId: string) {
    const perms = await tx.permission.findMany();
    const byKey = new Map(perms.map((p: any) => [p.key, p]));

    const createdRoles = [];
    for (const name of ROLES) {
      const role = await tx.role.upsert({
        where: { organizationId_name: { organizationId, name } },
        create: { organizationId, name, isSystem: true },
        update: {},
      });
      createdRoles.push(role);
    }

    const roleIds = createdRoles.map((r: any) => r.id);
    const existingRPs = await tx.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
    });
    const existingPairs = new Set(existingRPs.map((rp: any) => `${rp.roleId}:${rp.permissionId}`));

    const missingRolePerms: { roleId: string; permissionId: string }[] = [];
    for (const role of createdRoles) {
      const keys = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS] || [];
      for (const key of keys) {
        const perm: any = byKey.get(key);
        if (!perm) continue;
        const pairKey = `${role.id}:${perm.id}`;
        if (!existingPairs.has(pairKey)) {
          missingRolePerms.push({ roleId: role.id, permissionId: perm.id });
          existingPairs.add(pairKey);
        }
      }
    }

    if (missingRolePerms.length > 0) {
      await tx.rolePermission.createMany({
        data: missingRolePerms,
      });
    }

    return createdRoles;
  }
}
