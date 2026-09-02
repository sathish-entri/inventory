import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { InventoryService } from "./inventory.service";
import { SequenceService } from "../../common/sequence.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { AdjustStockDto, CreateBatchDto, CreateSerialDto, OpeningStockDto, TransferDto } from "../catalog/dto";

@ApiTags("inventory")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly sequences: SequenceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("inventory")
  @RequirePermissions("inventory:read")
  list(
    @CurrentUser() user: AuthUser,
    @Query("warehouseId") warehouseId?: string,
    @Query("productId") productId?: string,
  ) {
    return this.inventory.listStock(user.organizationId, warehouseId, productId);
  }

  @Post("inventory/opening-stock")
  @RequirePermissions("inventory:adjust")
  opening(@CurrentUser() user: AuthUser, @Body() dto: OpeningStockDto) {
    return this.inventory.openingStock({
      organizationId: user.organizationId,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      referenceType: "opening_stock",
      referenceId: dto.productId,
      createdById: user.id,
      reason: "Opening stock",
    });
  }

  @Post("inventory/opening-stock/bulk")
  @RequirePermissions("inventory:adjust")
  bulkOpening(@CurrentUser() user: AuthUser, @Body() body: any) {
    const items = Array.isArray(body) ? body : (body?.items ?? []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("Payload must be a non-empty array of opening stock objects.");
    }
    return this.inventory.bulkOpeningStock(user.organizationId, user.id, items);
  }

  @Post("inventory/adjustments")
  @RequirePermissions("inventory:adjust")
  async adjust(@CurrentUser() user: AuthUser, @Body() dto: AdjustStockDto) {
    const adj = await this.prisma.stockAdjustment.create({
      data: {
        organizationId: user.organizationId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        quantityDelta: dto.quantityDelta,
        reason: dto.reason,
        notes: dto.notes,
        createdById: user.id,
      },
    });
    await this.inventory.adjust(
      user.organizationId,
      dto.warehouseId,
      dto.productId,
      dto.quantityDelta,
      dto.reason,
      user.id,
      dto.notes,
    );
    return adj;
  }

  @Get("inventory/adjustments")
  @RequirePermissions("inventory:read")
  listAdjustments(@CurrentUser() user: AuthUser) {
    return this.prisma.stockAdjustment.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("inventory/transfers")
  @RequirePermissions("inventory:transfer")
  async transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) {
    const number = await this.sequences.nextInTx(this.prisma, user.organizationId, "TRF", "TRF");
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        organizationId: user.organizationId,
        number,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        status: "COMPLETED",
        notes: dto.notes,
        createdById: user.id,
        completedAt: new Date(),
        lines: { create: dto.lines },
      },
      include: { lines: true },
    });
    await this.inventory.transfer(
      user.organizationId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.lines,
      user.id,
    );
    return transfer;
  }

  @Get("inventory/transfers")
  @RequirePermissions("inventory:read")
  listTransfers(@CurrentUser() user: AuthUser) {
    return this.prisma.stockTransfer.findMany({
      where: { organizationId: user.organizationId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("inventory/ledger")
  @RequirePermissions("inventory:read")
  ledger(@CurrentUser() user: AuthUser) {
    return this.prisma.inventoryTransaction.findMany({
      where: { organizationId: user.organizationId },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  @Post("inventory/batches")
  @RequirePermissions("inventory:adjust")
  async createBatch(@CurrentUser() user: AuthUser, @Body() dto: CreateBatchDto) {
    const batch = await this.prisma.batch.create({
      data: {
        organizationId: user.organizationId,
        productId: dto.productId,
        batchNumber: dto.batchNumber,
        manufacturedAt: dto.manufacturedAt ? new Date(dto.manufacturedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        stocks: {
          create: { warehouseId: dto.warehouseId, quantity: dto.quantity },
        },
      },
      include: { stocks: true },
    });
    await this.inventory.openingStock({
      organizationId: user.organizationId,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      referenceType: "batch",
      referenceId: batch.id,
      createdById: user.id,
      reason: `Batch ${dto.batchNumber}`,
    });
    return batch;
  }

  @Get("inventory/batches")
  @RequirePermissions("inventory:read")
  listBatches(@CurrentUser() user: AuthUser) {
    return this.prisma.batch.findMany({
      where: { organizationId: user.organizationId },
      include: { product: true, stocks: { include: { warehouse: true } } },
    });
  }

  @Post("inventory/serials")
  @RequirePermissions("inventory:adjust")
  createSerial(@CurrentUser() user: AuthUser, @Body() dto: CreateSerialDto) {
    return this.prisma.serialNumber.create({
      data: {
        organizationId: user.organizationId,
        productId: dto.productId,
        serial: dto.serial,
        warehouseId: dto.warehouseId,
        status: "AVAILABLE",
      },
    });
  }

  @Get("inventory/serials")
  @RequirePermissions("inventory:read")
  listSerials(@CurrentUser() user: AuthUser) {
    return this.prisma.serialNumber.findMany({
      where: { organizationId: user.organizationId },
      include: { product: true },
    });
  }

  @Get("inventory/reorder")
  @RequirePermissions("inventory:read")
  async reorder(@CurrentUser() user: AuthUser) {
    const stocks = await this.inventory.listStock(user.organizationId);
    return stocks.filter((s: any) => s.availableQuantity <= Number(s.product.reorderLevel));
  }
}
