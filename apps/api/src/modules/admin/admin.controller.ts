import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { InviteUserDto } from "../catalog/dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("organization")
  @RequirePermissions("organization:read")
  org(@CurrentUser() user: AuthUser) {
    return this.prisma.organization.findUnique({ where: { id: user.organizationId } });
  }

  @Patch("organization")
  @RequirePermissions("organization:update")
  updateOrg(@CurrentUser() user: AuthUser, @Body() body: { name?: string; allowNegativeStock?: boolean }) {
    return this.prisma.organization.update({
      where: { id: user.organizationId },
      data: body,
    });
  }

  @Get("users")
  @RequirePermissions("user:read")
  users(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerifiedAt: true,
        roles: { include: { role: true } },
      },
    });
  }

  @Post("users")
  @RequirePermissions("user:create")
  async invite(@CurrentUser() user: AuthUser, @Body() dto: InviteUserDto) {
    const roleName = dto.roleName?.trim();
    if (!roleName) {
      throw new BadRequestException("Role name is required");
    }

    const permissions = user.permissions || [];
    if (roleName.toLowerCase() === "admin" && !permissions.includes("role:manage")) {
      throw new ForbiddenException("Privilege restriction: Assigning the Admin role requires 'role:manage' permission.");
    }

    const role = await this.prisma.role.findFirst({
      where: { organizationId: user.organizationId, name: roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role "${roleName}" does not exist in your organization.`);
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictException(`A user with email "${normalizedEmail}" already exists.`);
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const created = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          organizationId: user.organizationId,
          email: normalizedEmail,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
        },
      });

      await tx.userRole.create({
        data: { userId: newUser.id, roleId: role.id },
      });

      return newUser;
    });

    const safe: Record<string, any> = { ...created };
    delete safe.passwordHash;
    return safe;
  }

  @Get("roles")
  @RequirePermissions("role:manage")
  roles(@CurrentUser() user: AuthUser) {
    return this.prisma.role.findMany({
      where: { organizationId: user.organizationId },
      include: { permissions: { include: { permission: true } } },
    });
  }

  @Get("audit-logs")
  @RequirePermissions("audit:read")
  audit(@CurrentUser() user: AuthUser) {
    return this.prisma.auditLog.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  @Get("notifications")
  @RequirePermissions("notification:read")
  notifications(@CurrentUser() user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  @Post("notifications/:id/read")
  @RequirePermissions("notification:read")
  read(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prisma.notification.updateMany({
      where: { id, organizationId: user.organizationId },
      data: { readAt: new Date() },
    });
  }

  @Get("integrations")
  @RequirePermissions("integration:manage")
  integrations(@CurrentUser() user: AuthUser) {
    return this.prisma.integrationConfig.findMany({ where: { organizationId: user.organizationId } });
  }

  @Post("integrations")
  @RequirePermissions("integration:manage")
  upsertIntegration(
    @CurrentUser() user: AuthUser,
    @Body() body: { provider: string; type: string; config: any; isEnabled: boolean },
  ) {
    return this.prisma.integrationConfig.upsert({
      where: {
        organizationId_provider: { organizationId: user.organizationId, provider: body.provider },
      },
      create: { organizationId: user.organizationId, ...body },
      update: body,
    });
  }
}
