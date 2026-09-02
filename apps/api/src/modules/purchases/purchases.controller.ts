import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { PurchasesService } from "./purchases.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { CreatePurchaseOrderDto, ReceiveDto, ReturnDto } from "../catalog/dto";
import { VendorPayDto } from "./vendor-pay.dto";

@ApiTags("purchases")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Post("purchase-orders")
  @RequirePermissions("purchase_order:create")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchases.createPurchaseOrder(user.organizationId, dto);
  }

  @Get("purchase-orders")
  @RequirePermissions("purchase_order:read")
  list(@CurrentUser() user: AuthUser) {
    return this.purchases.listPurchaseOrders(user.organizationId);
  }

  @Post("purchase-orders/:id/receive")
  @RequirePermissions("purchase_receive:create")
  receive(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ReceiveDto) {
    return this.purchases.receive(user.organizationId, id, dto, user.id);
  }

  @Get("purchase-receives")
  @RequirePermissions("purchase_receive:read")
  receives(@CurrentUser() user: AuthUser) {
    return this.purchases.listReceives(user.organizationId);
  }

  @Post("bills/from-order/:purchaseOrderId")
  @RequirePermissions("bill:create")
  bill(@CurrentUser() user: AuthUser, @Param("purchaseOrderId") purchaseOrderId: string) {
    return this.purchases.createBillFromPO(user.organizationId, purchaseOrderId);
  }

  @Get("bills")
  @RequirePermissions("bill:read")
  bills(@CurrentUser() user: AuthUser) {
    return this.purchases.listBills(user.organizationId);
  }

  @Post("bills/:id/pay")
  @RequirePermissions("vendor_payment:create")
  pay(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: VendorPayDto) {
    return this.purchases.payBill(user.organizationId, id, dto.vendorId, dto.amount, dto.method);
  }

  @Post("purchase-returns")
  @RequirePermissions("return:create")
  ret(@CurrentUser() user: AuthUser, @Body() dto: ReturnDto) {
    return this.purchases.createPurchaseReturn(user.organizationId, dto, user.id);
  }

  @Get("purchase-returns")
  @RequirePermissions("return:read")
  listReturns(@CurrentUser() user: AuthUser) {
    return this.purchases.listPurchaseReturns(user.organizationId);
  }
}
