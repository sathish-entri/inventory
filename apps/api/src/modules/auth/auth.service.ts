import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
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

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN";
const GRACE_PERIOD_MS = 15000; // 15s grace window for concurrent SPA refresh calls

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function slugify(name: string) {
  const slug = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "org";
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private permissionsEnsured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  async register(dto: RegisterDto, meta?: { ip?: string; userAgent?: string }) {
    const rounds = Number(this.config.get("BCRYPT_ROUNDS", 10));
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const normalizedEmail = dto.email.toLowerCase().trim();

    const baseSlug = slugify(dto.organizationName);
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const slug = existingOrg ? `${baseSlug}-${randomBytes(3).toString("hex")}` : baseSlug;

    const result = await this.prisma.$transaction(
      async (tx: any) => {
        const organization = await tx.organization.create({
          data: { name: dto.organizationName.trim(), slug },
        });

        await this.ensurePermissions(tx);
        const roles = await this.seedRoles(tx, organization.id);

        const user = await tx.user.create({
          data: {
            organizationId: organization.id,
            email: normalizedEmail,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
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
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    // Send email non-blocking to prevent register latency
    this.email
      .send(
        normalizedEmail,
        "Verify your Inventra account",
        `<p>Welcome to Inventra! Your verification token is: <strong>${verifyToken}</strong></p>`,
      )
      .catch((err: any) => {
        this.logger.warn(`Failed to dispatch verification email to ${normalizedEmail}: ${err.message}`);
      });

    return this.issueTokens(result.user.id, result.organization.id, normalizedEmail, meta, PERMISSIONS);
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }) {
    const email = dto.email.toLowerCase().trim();
    const users = await this.prisma.user.findMany({
      where: {
        email,
        ...(dto.organizationSlug ? { organization: { slug: dto.organizationSlug.toLowerCase().trim() } } : {}),
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        organizationId: true,
      },
    });

    // Timing mitigation: run dummy compare if no user exists
    if (users.length === 0) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (users.length > 1) {
      if (!dto.organizationSlug) {
        throw new BadRequestException(
          "Multiple accounts found for this email. Please provide your organization slug to sign in.",
        );
      }
      throw new UnauthorizedException("Invalid credentials..");
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials...");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account disabled. Please contact your administrator.");
    }

    return this.issueTokens(user.id, user.organizationId, user.email, meta);
  }

  async refresh(refreshToken: string, meta?: { ip?: string; userAgent?: string }) {
    if (!refreshToken || !refreshToken.trim()) {
      throw new UnauthorizedException("Refresh token is required");
    }

    const tokenHash = sha256(refreshToken.trim());
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    if (!stored.user || !stored.user.isActive) {
      throw new UnauthorizedException("Account disabled");
    }

    // Reuse detection and grace period logic (RFC 6819)
    if (stored.revokedAt) {
      const elapsed = Date.now() - stored.revokedAt.getTime();
      if (elapsed <= GRACE_PERIOD_MS) {
        // Safe concurrent request within grace window: issue a fresh session
        return this.issueTokens(stored.userId, stored.organizationId, stored.user.email, meta);
      }

      // Token reuse detected outside grace window: Potential token theft!
      // Invalidate all active sessions for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Refresh token reuse detected for userId=${stored.userId}. All sessions revoked.`);
      throw new UnauthorizedException("Security violation: Refresh token reuse detected. All sessions terminated.");
    }

    // Revoke current token immediately
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.userId, stored.organizationId, stored.user.email, meta);

    // Link lineage
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedById: tokens.tokenId },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
    };
  }

  async logout(refreshToken: string | undefined, userId?: string) {
    if (refreshToken && refreshToken.trim()) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(refreshToken.trim()), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async forgotPassword(email: string, organizationSlug?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const users = await this.prisma.user.findMany({
      where: {
        email: normalizedEmail,
        ...(organizationSlug ? { organization: { slug: organizationSlug.toLowerCase().trim() } } : {}),
      },
    });

    if (users.length === 0) return { success: true };

    for (const user of users) {
      // Invalidate existing unused reset tokens for this user
      await this.prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
        },
      });

      try {
        await this.email.send(
          normalizedEmail,
          "Reset your password",
          `<p>You requested a password reset. Your reset token is: <strong>${token}</strong> (expires in 30 minutes).</p>`,
        );
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch password reset email: ${err.message}`);
      }
    }

    return { success: true };
  }

  async resetPassword(token: string, password: string) {
    const trimmedToken = token.trim();
    const row = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(trimmedToken) },
    });

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const rounds = Number(this.config.get("BCRYPT_ROUNDS", 10));
    const newPasswordHash = await bcrypt.hash(password, rounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: newPasswordHash },
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
    const trimmedToken = token.trim();
    const row = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(`verify:${trimmedToken}`) },
    });

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.passwordReset.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
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

    const safe: Record<string, any> = { ...user };
    delete safe.passwordHash;
    const permissions = [
      ...new Set(user.roles.flatMap((ur: any) => ur.role.permissions.map((p: any) => p.permission.key))),
    ];

    return {
      ...safe,
      permissions,
    };
  }

  private async issueTokens(
    userId: string,
    organizationId: string,
    email: string,
    meta?: { ip?: string; userAgent?: string },
    cachedPermissions?: string[] | readonly string[],
  ) {
    const permissions = cachedPermissions ?? (await this.loadPermissions(userId));
    const accessToken = await this.jwt.signAsync(
      { sub: userId, orgId: organizationId, email, permissions },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN", "15m"),
      },
    );

    const refreshRaw = randomBytes(48).toString("hex");
    const days = 7;
    const storedToken = await this.prisma.refreshToken.create({
      data: {
        organizationId,
        userId,
        tokenHash: sha256(refreshRaw),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      tokenType: "Bearer" as const,
      tokenId: storedToken.id,
    };
  }

  private async loadPermissions(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: { key: true },
                },
              },
            },
          },
        },
      },
    });
    return [...new Set(roles.flatMap((r: any) => r.role.permissions.map((p: any) => p.permission.key)))] as string[];
  }

  private async ensurePermissions(tx: any) {
    if (this.permissionsEnsured) return;
    const existing = await tx.permission.findMany({ select: { key: true } });
    const existingKeys = new Set(existing.map((p: any) => p.key));
    const missing = PERMISSIONS.filter((key) => !existingKeys.has(key));
    if (missing.length > 0) {
      await tx.permission.createMany({
        data: missing.map((key) => ({ key })),
      });
    }
    this.permissionsEnsured = true;
  }

  async seedRoles(tx: any, organizationId: string) {
    const perms = await tx.permission.findMany({ select: { id: true, key: true } });
    const byKey = new Map(perms.map((p: any) => [p.key, p]));

    const createdRoles = await Promise.all(
      ROLES.map((name) =>
        tx.role.upsert({
          where: { organizationId_name: { organizationId, name } },
          create: { organizationId, name, isSystem: true },
          update: {},
        }),
      ),
    );

    const roleIds = createdRoles.map((r: any) => r.id);
    const existingRPs = await tx.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      select: { roleId: true, permissionId: true },
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
