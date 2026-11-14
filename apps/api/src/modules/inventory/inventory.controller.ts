import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { InventoryService } from "./inventory.service";
import { SequenceService } from "../../common/sequence.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { AdjustStockDto, CreateBatchDto, CreateSerialDto, OpeningStockDto, TransferDto, ProduceGoodsDto, DailyProductionLogDto } from "../catalog/dto";
import { paginateMeta, PaginationQueryDto } from "../../common/pagination";
import { AdjustmentQueryDto, InventoryQueryDto, LedgerQueryDto, ProductionRunQueryDto, TransferQueryDto } from "./dto";

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
    @Query() query: InventoryQueryDto,
  ) {
    return this.inventory.listStockPaginated(user.organizationId, query);
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
  adjust(@CurrentUser() user: AuthUser, @Body() dto: AdjustStockDto) {
    return this.inventory.adjust(
      user.organizationId,
      dto.warehouseId,
      dto.productId,
      dto.quantityDelta,
      dto.reason,
      user.id,
      dto.notes,
    );
  }

  @Get("inventory/adjustments")
  @RequirePermissions("inventory:read")
  async listAdjustments(@CurrentUser() user: AuthUser, @Query() query: AdjustmentQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: user.organizationId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.search?.trim()) {
      where.OR = [
        { reason: { contains: query.search.trim(), mode: "insensitive" } },
        { notes: { contains: query.search.trim(), mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  @Post("inventory/transfers")
  @RequirePermissions("inventory:transfer")
  transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) {
    return this.inventory.transfer(
      user.organizationId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.lines,
      user.id,
    );
  }

  @Get("inventory/transfers")
  @RequirePermissions("inventory:read")
  async listTransfers(@CurrentUser() user: AuthUser, @Query() query: TransferQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: user.organizationId };
    if (query.status) where.status = query.status;
    if (query.fromWarehouseId) where.fromWarehouseId = query.fromWarehouseId;
    if (query.toWarehouseId) where.toWarehouseId = query.toWarehouseId;
    if (query.search?.trim()) {
      where.number = { contains: query.search.trim(), mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        select: {
          id: true,
          number: true,
          fromWarehouseId: true,
          toWarehouseId: true,
          status: true,
          createdAt: true,
          lines: { select: { id: true, productId: true, quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  @Get("inventory/ledger")
  @RequirePermissions("inventory:read")
  async ledger(@CurrentUser() user: AuthUser, @Query() query: LedgerQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: user.organizationId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { product: { name: { contains: s, mode: "insensitive" } } },
        { product: { sku: { contains: s, mode: "insensitive" } } },
        { referenceId: { contains: s, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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
  async listBatches(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: user.organizationId };
    if (query.search?.trim()) {
      where.OR = [
        { batchNumber: { contains: query.search.trim(), mode: "insensitive" } },
        { product: { name: { contains: query.search.trim(), mode: "insensitive" } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        include: { product: true, stocks: { include: { warehouse: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.batch.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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
  async listSerials(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: user.organizationId };
    if (query.search?.trim()) {
      where.OR = [
        { serial: { contains: query.search.trim(), mode: "insensitive" } },
        { product: { name: { contains: query.search.trim(), mode: "insensitive" } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.serialNumber.findMany({
        where,
        include: { product: true },
        skip,
        take: pageSize,
      }),
      this.prisma.serialNumber.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  @Get("inventory/reorder")
  @RequirePermissions("inventory:read")
  async reorder(@CurrentUser() user: AuthUser) {
    const stocks = await this.inventory.listStock(user.organizationId);
    return stocks.filter((s: any) => s.availableQuantity <= Number(s.product.reorderLevel));
  }

  @Post("inventory/produce")
  @RequirePermissions("inventory:adjust")
  produce(@CurrentUser() user: AuthUser, @Body() dto: ProduceGoodsDto) {
    return this.inventory.produceGoods(user.organizationId, user.id, dto);
  }

  @Get("inventory/production-runs")
  @RequirePermissions("inventory:read")
  listProductionRuns(
    @CurrentUser() user: AuthUser,
    @Query() query: ProductionRunQueryDto,
  ) {
    return this.inventory.listProductionRuns(user.organizationId, query);
  }

  @Get("inventory/production-feasibility/:productId")
  @RequirePermissions("inventory:read")
  getProductionFeasibility(
    @CurrentUser() user: AuthUser,
    @Param("productId") productId: string,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.inventory.getProductionFeasibility(user.organizationId, productId, warehouseId);
  }

  @Post("inventory/daily-production-log")
  @RequirePermissions("inventory:adjust")
  postDailyProductionLog(@CurrentUser() user: AuthUser, @Body() dto: DailyProductionLogDto) {
    return this.inventory.postDailyProductionLog(user.organizationId, user.id, dto);
  }

  @Get("inventory/production-monthly-analytics")
  @RequirePermissions("inventory:read")
  getMonthlyProductionAnalytics(
    @CurrentUser() user: AuthUser,
    @Query("year") year?: string,
    @Query("month") month?: string,
    @Query("warehouseId") warehouseId?: string,
  ) {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;
    return this.inventory.getMonthlyProductionAnalytics(user.organizationId, y, m, warehouseId);
  }
}
