import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ReportsService } from "./reports.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("dashboard")
  @RequirePermissions("report:read")
  dashboard(@CurrentUser() user: AuthUser, @Query("warehouseId") warehouseId?: string) {
    return this.reports.dashboard(user.organizationId, warehouseId || undefined);
  }

  @Get("reports/inventory")
  @RequirePermissions("report:read")
  inventory(@CurrentUser() user: AuthUser) {
    return this.reports.inventorySummary(user.organizationId);
  }

  @Get("reports/movement")
  @RequirePermissions("report:read")
  movement(@CurrentUser() user: AuthUser) {
    return this.reports.movement(user.organizationId);
  }

  @Get("reports/low-stock")
  @RequirePermissions("report:read")
  lowStock(@CurrentUser() user: AuthUser) {
    return this.reports.lowStock(user.organizationId);
  }

  @Get("reports/batch-expiry")
  @RequirePermissions("report:read")
  expiry(@CurrentUser() user: AuthUser) {
    return this.reports.batchExpiry(user.organizationId);
  }

  @Get("reports/serials")
  @RequirePermissions("report:read")
  serials(@CurrentUser() user: AuthUser) {
    return this.reports.serials(user.organizationId);
  }

  @Get("reports/sales-by-customer")
  @RequirePermissions("report:read")
  byCustomer(@CurrentUser() user: AuthUser) {
    return this.reports.salesByCustomer(user.organizationId);
  }

  @Get("reports/export.csv")
  @RequirePermissions("report:read")
  async csv(@CurrentUser() user: AuthUser, @Query("type") type = "inventory") {
    const rows =
      type === "low-stock"
        ? await this.reports.lowStock(user.organizationId)
        : await this.reports.inventorySummary(user.organizationId);
    const header = Object.keys(rows[0] ?? { empty: "" }).join(",");
    const body = rows.map((r: any) => Object.values(r as object).join(",")).join("\n");
    return { filename: `${type}.csv`, content: `${header}\n${body}` };
  }
}
