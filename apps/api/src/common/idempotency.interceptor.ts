import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from "@nestjs/common";
import { Observable, of, from } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./current-user.decorator";
import { Request } from "express";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const key = req.header("Idempotency-Key");
    if (!key || !req.user || req.method === "GET") {
      return next.handle();
    }
    const hash = createHash("sha256")
      .update(`${req.method}:${req.path}:${JSON.stringify(req.body ?? {})}`)
      .digest("hex");

    return from(
      this.prisma.idempotencyKey.findUnique({
        where: { organizationId_key: { organizationId: req.user.organizationId, key } },
      }),
    ).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.requestHash !== hash) {
            throw new ConflictException("Idempotency-Key reused with a different payload");
          }
          return of(existing.responseBody);
        }
        return next.handle().pipe(
          tap(async (body) => {
            await this.prisma.idempotencyKey.create({
              data: {
                organizationId: req.user!.organizationId,
                key,
                requestHash: hash,
                responseStatus: 200,
                responseBody: body as object,
              },
            });
          }),
        );
      }),
    );
  }
}
