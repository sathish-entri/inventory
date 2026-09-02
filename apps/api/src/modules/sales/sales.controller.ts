import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { SalesService } from "./sales.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { CreateEstimateDto, CreateSalesOrderDto, PackageDto, PaymentDto, ReturnDto } from "../catalog/dto";

@ApiTags("sales")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post("estimates")
  @RequirePermissions("estimate:create")
  createEstimate(@CurrentUser() user: AuthUser, @Body() dto: CreateEstimateDto) {
    return this.sales.createEstimate(user.organizationId, dto.customerId, dto.lines, dto.discount ?? 0);
  }

  @Get("estimates")
  @RequirePermissions("estimate:read")
  listEstimates(@CurrentUser() user: AuthUser) {
    return this.sales.listEstimates(user.organizationId);
  }

  @Post("sales-orders")
  @RequirePermissions("sales_order:create")
  createSO(@CurrentUser() user: AuthUser, @Body() dto: CreateSalesOrderDto) {
    return this.sales.createSalesOrder(user.organizationId, dto);
  }

  @Get("sales-orders")
  @RequirePermissions("sales_order:read")
  listSO(@CurrentUser() user: AuthUser) {
    return this.sales.listSalesOrders(user.organizationId);
  }

  @Get("sales-orders/:id")
  @RequirePermissions("sales_order:read")
  getSO(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sales.getSalesOrder(user.organizationId, id);
  }

  @Post("sales-orders/:id/confirm")
  @RequirePermissions("sales_order:confirm")
  confirm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sales.confirmSalesOrder(user.organizationId, id, user.id);
  }

  @Post("sales-orders/:id/cancel")
  @RequirePermissions("sales_order:cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sales.cancelSalesOrder(user.organizationId, id);
  }

  @Post("packages")
  @RequirePermissions("package:create")
  pack(@CurrentUser() user: AuthUser, @Body() dto: PackageDto) {
    return this.sales.createPackage(user.organizationId, dto);
  }

  @Get("packages")
  @RequirePermissions("package:read")
  packages(@CurrentUser() user: AuthUser) {
    return this.sales.listPackages(user.organizationId);
  }

  @Post("shipments/from-package/:packageId")
  @RequirePermissions("shipment:confirm")
  ship(@CurrentUser() user: AuthUser, @Param("packageId") packageId: string) {
    return this.sales.createShipment(user.organizationId, packageId, user.id);
  }

  @Get("shipments")
  @RequirePermissions("shipment:read")
  shipments(@CurrentUser() user: AuthUser) {
    return this.sales.listShipments(user.organizationId);
  }

  @Post("invoices/from-order/:salesOrderId")
  @RequirePermissions("invoice:create")
  invoice(@CurrentUser() user: AuthUser, @Param("salesOrderId") salesOrderId: string) {
    return this.sales.createInvoiceFromOrder(user.organizationId, salesOrderId);
  }

  @Get("invoices")
  @RequirePermissions("invoice:read")
  invoices(@CurrentUser() user: AuthUser) {
    return this.sales.listInvoices(user.organizationId);
  }

  @Post("payments")
  @RequirePermissions("payment:create")
  pay(@CurrentUser() user: AuthUser, @Body() dto: PaymentDto) {
    return this.sales.recordPayment(user.organizationId, dto);
  }

  @Get("payments")
  @RequirePermissions("payment:read")
  payments(@CurrentUser() user: AuthUser) {
    return this.sales.listPayments(user.organizationId);
  }

  @Post("sales-returns")
  @RequirePermissions("return:create")
  createReturn(@CurrentUser() user: AuthUser, @Body() dto: ReturnDto) {
    return this.sales.createSalesReturn(user.organizationId, dto, user.id);
  }

  @Post("sales-returns/:id/receive")
  @RequirePermissions("return:approve")
  receiveReturn(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sales.receiveSalesReturn(user.organizationId, id, user.id);
  }

  @Get("sales-returns")
  @RequirePermissions("return:read")
  listReturns(@CurrentUser() user: AuthUser) {
    return this.sales.listSalesReturns(user.organizationId);
  }
}
