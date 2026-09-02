import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogService } from "./modules/catalog/catalog.service";
import { CatalogController } from "./modules/catalog/catalog.controller";
import { InventoryService } from "./modules/inventory/inventory.service";
import { InventoryController } from "./modules/inventory/inventory.controller";
import { SalesService } from "./modules/sales/sales.service";
import { SalesController } from "./modules/sales/sales.controller";
import { PurchasesService } from "./modules/purchases/purchases.service";
import { PurchasesController } from "./modules/purchases/purchases.controller";
import { ReportsService } from "./modules/reports/reports.service";
import { ReportsController } from "./modules/reports/reports.controller";
import { AdminController } from "./modules/admin/admin.controller";
import { WebhooksController } from "./modules/integrations/webhooks.controller";
import { HealthController } from "./common/health.controller";
import { SequenceService } from "./common/sequence.service";
import { AuditInterceptor } from "./common/audit.interceptor";
import { IdempotencyInterceptor } from "./common/idempotency.interceptor";
import {
  EMAIL_PROVIDER,
  PAYMENT_PROVIDER,
  SHIPPING_PROVIDER,
  StubEmailProvider,
  StubPaymentProvider,
  StubShippingProvider,
} from "./modules/integrations/providers";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    HealthController,
    CatalogController,
    InventoryController,
    SalesController,
    PurchasesController,
    ReportsController,
    AdminController,
    WebhooksController,
  ],
  providers: [
    CatalogService,
    InventoryService,
    SalesService,
    PurchasesService,
    ReportsService,
    SequenceService,
    { provide: PAYMENT_PROVIDER, useClass: StubPaymentProvider },
    { provide: SHIPPING_PROVIDER, useClass: StubShippingProvider },
    { provide: EMAIL_PROVIDER, useClass: StubEmailProvider },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {}
