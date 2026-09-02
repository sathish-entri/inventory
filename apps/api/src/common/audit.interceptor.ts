import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./current-user.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const method = req.method;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next.handle();
    }
    return next.handle().pipe(
      tap(async (result) => {
        if (!req.user) return;
        const resource = (result as { id?: string } | undefined)?.id;
        await this.prisma.auditLog.create({
          data: {
            organizationId: req.user.organizationId,
            userId: req.user.id,
            action: `${method} ${req.path}`,
            resourceType: req.path.split("/")[1] ?? "unknown",
            resourceId: resource ?? "n/a",
            newValues: result && typeof result === "object" ? JSON.parse(JSON.stringify(result)) : undefined,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });
      }),
    );
  }
}
