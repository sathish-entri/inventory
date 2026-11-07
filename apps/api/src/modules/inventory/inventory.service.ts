import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InventoryTxnType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  applyDecrease,
  applyIncrease,
  applyRelease,
  applyReserve,
  applyShipment,
  availableQuantity,
  explodeComposite,
  round4,
  type StockSnapshot,
} from "./inventory.math";

export interface StockMutation {
  organizationId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  type: InventoryTxnType;
  referenceType: string;
  referenceId: string;
  reason?: string;
  createdById: string;
  idempotencyKey?: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(organizationId: string, productId: string, warehouseId: string) {
    const row = await this.prisma.inventoryStock.findUnique({
      where: {
        organizationId_productId_warehouseId: { organizationId, productId, warehouseId },
      },
    });
    const quantity = Number(row?.quantity ?? 0);
    const reservedQuantity = Number(row?.reservedQuantity ?? 0);
    return {
      quantity,
      reservedQuantity,
      availableQuantity: availableQuantity(quantity, reservedQuantity),
    };
  }

  async listStock(organizationId: string, warehouseId?: string, productId?: string) {
    const rows = await this.prisma.inventoryStock.findMany({
      where: {
        organizationId,
        ...(warehouseId ? { warehouseId } : {}),
        ...(productId ? { productId } : {}),
        warehouseId: { not: "" },
      },
      select: {
        id: true,
        organizationId: true,
        productId: true,
        warehouseId: true,
        quantity: true,
        reservedQuantity: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            type: true,
            classification: true,
            reorderLevel: true,
            sellingPrice: true,
            costPrice: true,
            unit: {
              select: {
                name: true,
                abbreviation: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows
      .filter((r: any) => r.warehouse && r.product)
      .map((r: any) => ({
        ...r,
        quantity: Number(r.quantity),
        reservedQuantity: Number(r.reservedQuantity),
        availableQuantity: availableQuantity(Number(r.quantity), Number(r.reservedQuantity)),
      }));
  }

  private snapshot(row: { quantity: Prisma.Decimal; reservedQuantity: Prisma.Decimal }): StockSnapshot {
    return { quantity: Number(row.quantity), reservedQuantity: Number(row.reservedQuantity) };
  }

  private async lockStock(
    tx: any,
    organizationId: string,
    productId: string,
    warehouseId: string,
  ) {
    if (!productId || !productId.trim() || !warehouseId || !warehouseId.trim()) {
      throw new BadRequestException("Product ID and Warehouse ID are required for stock operations");
    }
    let row = await tx.inventoryStock.findUnique({
      where: {
        organizationId_productId_warehouseId: { organizationId, productId, warehouseId },
      },
    });
    if (!row) {
      row = await tx.inventoryStock.create({
        data: { organizationId, productId, warehouseId, quantity: 0, reservedQuantity: 0 },
      });
    }
    return row;
  }

  private async writeLedger(
    tx: any,
    args: StockMutation & { before: number; after: number; signedQty: number },
  ) {
    if (args.idempotencyKey) {
      const existing = await tx.inventoryTransaction.findFirst({
        where: {
          organizationId: args.organizationId,
          idempotencyKey: args.idempotencyKey,
        },
      });
      if (existing) throw new ConflictException("Duplicate idempotency key");
    }
    return tx.inventoryTransaction.create({
      data: {
        organizationId: args.organizationId,
        productId: args.productId,
        warehouseId: args.warehouseId,
        type: args.type,
        quantity: round4(args.signedQty),
        beforeQuantity: round4(args.before),
        afterQuantity: round4(args.after),
        referenceType: args.referenceType,
        referenceId: args.referenceId,
        reason: args.reason,
        createdById: args.createdById,
        idempotencyKey: args.idempotencyKey,
      },
    });
  }

  async reserveLines(
    organizationId: string,
    warehouseId: string,
    lines: { productId: string; quantity: number }[],
    referenceType: string,
    referenceId: string,
    createdById: string,
  ) {
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
      include: { components: true },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const flatLines: { productId: string; quantity: number }[] = [];
    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) throw new NotFoundException("Product not found");
      if (product.type === "COMPOSITE") {
        const exploded = explodeComposite(
          line.quantity,
          product.components.map((c: any) => ({
            childProductId: c.childProductId,
            quantity: Number(c.quantity),
          })),
        );
        flatLines.push(...exploded);
      } else {
        flatLines.push({ productId: line.productId, quantity: line.quantity });
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      for (const item of flatLines) {
        const row = await this.lockStock(tx, organizationId, item.productId, warehouseId);
        const cur = this.snapshot(row);
        const next = applyReserve(cur, item.quantity, org.allowNegativeStock);
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: { reservedQuantity: next.reservedQuantity },
        });
        await tx.reservation.create({
          data: {
            organizationId,
            productId: item.productId,
            warehouseId,
            quantity: item.quantity,
            referenceType,
            referenceId,
          },
        });
      }
    });
  }

  async shipReserved(
    organizationId: string,
    warehouseId: string,
    lines: { productId: string; quantity: number }[],
    referenceType: string,
    referenceId: string,
    createdById: string,
    idempotencyKeyPrefix?: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      for (const item of lines) {
        const row = await this.lockStock(tx, organizationId, item.productId, warehouseId);
        const cur = this.snapshot(row);
        const next = applyShipment(cur, item.quantity);
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: { quantity: next.quantity, reservedQuantity: next.reservedQuantity },
        });
        await this.writeLedger(tx, {
          organizationId,
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          type: "SALES_SHIPMENT",
          referenceType,
          referenceId,
          createdById,
          before: cur.quantity,
          after: next.quantity,
          signedQty: -item.quantity,
          idempotencyKey: idempotencyKeyPrefix ? `${idempotencyKeyPrefix}:${item.productId}` : undefined,
        });
        await this.maybeLowStockAlert(tx, organizationId, item.productId, warehouseId);
      }
    });
  }

  async releaseReservations(organizationId: string, referenceType: string, referenceId: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const active = await tx.reservation.findMany({
        where: { organizationId, referenceType, referenceId, releasedAt: null },
      });
      for (const res of active) {
        const row = await this.lockStock(tx, organizationId, res.productId, res.warehouseId);
        const cur = this.snapshot(row);
        const next = applyRelease(cur, Number(res.quantity));
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: { reservedQuantity: next.reservedQuantity },
        });
        await tx.reservation.update({
          where: { id: res.id },
          data: { releasedAt: new Date() },
        });
      }
    });
  }

  async receive(mutation: StockMutation) {
    return this.prisma.$transaction(async (tx: any) => {
      const row = await this.lockStock(
        tx,
        mutation.organizationId,
        mutation.productId,
        mutation.warehouseId,
      );
      const cur = this.snapshot(row);
      const next = applyIncrease(cur, mutation.quantity);
      await tx.inventoryStock.update({
        where: { id: row.id },
        data: { quantity: next.quantity },
      });
      await this.writeLedger(tx, {
        ...mutation,
        before: cur.quantity,
        after: next.quantity,
        signedQty: mutation.quantity,
      });
    });
  }

  async openingStock(mutation: Omit<StockMutation, "type">) {
    return this.receive({ ...mutation, type: "OPENING_STOCK" });
  }

  async bulkOpeningStock(organizationId: string, createdById: string, items: Array<any>) {
    const warehouses = await this.prisma.warehouse.findMany({ where: { organizationId } });
    const products = await this.prisma.product.findMany({ where: { organizationId } });

    const whById = new Map(warehouses.map((w: any) => [w.id, w]));
    const whByName = new Map(warehouses.map((w: any) => [w.name.toLowerCase().trim(), w]));

    const prodById = new Map(products.map((p: any) => [p.id, p]));
    const prodBySku = new Map(products.map((p: any) => [p.sku.toLowerCase().trim(), p]));
    const prodByName = new Map(products.map((p: any) => [p.name.toLowerCase().trim(), p]));

    const results = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      if (qty <= 0) continue;

      // 1. Resolve Warehouse
      let wh = item.warehouseId ? whById.get(item.warehouseId) : undefined;
      if (!wh && item.warehouseName) {
        wh = whByName.get(String(item.warehouseName).toLowerCase().trim());
      }
      if (!wh && warehouses.length > 0) {
        wh = warehouses[0]; // Default to primary warehouse
      }
      if (!wh) continue;

      // 2. Resolve Product by SKU / Name / productId
      let prod = item.productId ? prodById.get(item.productId) : undefined;
      if (!prod && item.sku) {
        prod = prodBySku.get(String(item.sku).toLowerCase().trim());
      }
      if (!prod && item.productName) {
        prod = prodByName.get(String(item.productName).toLowerCase().trim());
      }
      if (!prod && item.name) {
        prod = prodByName.get(String(item.name).toLowerCase().trim());
      }
      if (!prod) continue;

      const res = await this.openingStock({
        organizationId,
        productId: prod.id,
        warehouseId: wh.id,
        quantity: qty,
        referenceType: "opening_stock",
        referenceId: prod.id,
        createdById,
        reason: "Bulk opening stock upload",
      });
      results.push(res);
    }
    return { count: results.length, items: results };
  }

  async salesReturnReceive(mutation: StockMutation) {
    return this.receive({ ...mutation, type: "SALES_RETURN" });
  }

  async purchaseReturnIssue(mutation: StockMutation) {
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: mutation.organizationId } });
      const row = await this.lockStock(
        tx,
        mutation.organizationId,
        mutation.productId,
        mutation.warehouseId,
      );
      const cur = this.snapshot(row);
      const next = applyDecrease(cur, mutation.quantity, org.allowNegativeStock);
      await tx.inventoryStock.update({
        where: { id: row.id },
        data: { quantity: next.quantity },
      });
      await this.writeLedger(tx, {
        ...mutation,
        type: "PURCHASE_RETURN",
        before: cur.quantity,
        after: next.quantity,
        signedQty: -mutation.quantity,
      });
      await this.maybeLowStockAlert(
        tx,
        mutation.organizationId,
        mutation.productId,
        mutation.warehouseId,
      );
    });
  }

  async adjust(
    organizationId: string,
    warehouseId: string,
    productId: string,
    delta: number,
    reason: string,
    createdById: string,
    notes?: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const row = await this.lockStock(tx, organizationId, productId, warehouseId);
      const cur = this.snapshot(row);
      const next = delta >= 0 ? applyIncrease(cur, delta) : applyDecrease(cur, Math.abs(delta), org.allowNegativeStock);
      await tx.inventoryStock.update({
        where: { id: row.id },
        data: { quantity: next.quantity },
      });
      const adj = await tx.stockAdjustment.create({
        data: {
          organizationId,
          warehouseId,
          productId,
          quantityDelta: delta,
          reason,
          notes,
          createdById,
        },
      });
      await this.writeLedger(tx, {
        organizationId,
        productId,
        warehouseId,
        quantity: Math.abs(delta),
        type: "STOCK_ADJUSTMENT",
        referenceType: "stock_adjustment",
        referenceId: adj.id,
        reason,
        createdById,
        before: cur.quantity,
        after: next.quantity,
        signedQty: delta,
      });
      await this.maybeLowStockAlert(tx, organizationId, productId, warehouseId);
      return adj;
    });
  }

  async transfer(
    organizationId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    lines: { productId: string; quantity: number }[],
    createdById: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const number = `TRF-${Date.now().toString().slice(-6)}`;
      const transfer = await tx.stockTransfer.create({
        data: {
          organizationId,
          number,
          fromWarehouseId,
          toWarehouseId,
          status: "COMPLETED",
          completedAt: new Date(),
          createdById,
          lines: { create: lines },
        },
      });

      for (const item of lines) {
        const outRow = await this.lockStock(tx, organizationId, item.productId, fromWarehouseId);
        const outCur = this.snapshot(outRow);
        const outNext = applyDecrease(outCur, item.quantity, org.allowNegativeStock);
        await tx.inventoryStock.update({
          where: { id: outRow.id },
          data: { quantity: outNext.quantity },
        });
        await this.writeLedger(tx, {
          organizationId,
          productId: item.productId,
          warehouseId: fromWarehouseId,
          quantity: item.quantity,
          type: "STOCK_TRANSFER_OUT",
          referenceType: "stock_transfer",
          referenceId: transfer.id,
          createdById,
          before: outCur.quantity,
          after: outNext.quantity,
          signedQty: -item.quantity,
        });

        const inRow = await this.lockStock(tx, organizationId, item.productId, toWarehouseId);
        const inCur = this.snapshot(inRow);
        const inNext = applyIncrease(inCur, item.quantity);
        await tx.inventoryStock.update({
          where: { id: inRow.id },
          data: { quantity: inNext.quantity },
        });
        await this.writeLedger(tx, {
          organizationId,
          productId: item.productId,
          warehouseId: toWarehouseId,
          quantity: item.quantity,
          type: "STOCK_TRANSFER_IN",
          referenceType: "stock_transfer",
          referenceId: transfer.id,
          createdById,
          before: inCur.quantity,
          after: inNext.quantity,
          signedQty: item.quantity,
        });
      }
      return transfer;
    });
  }

  private async maybeLowStockAlert(
    tx: any,
    organizationId: string,
    productId: string,
    warehouseId: string,
  ) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) return;
    const stock = await tx.inventoryStock.findUnique({
      where: {
        organizationId_productId_warehouseId: { organizationId, productId, warehouseId },
      },
    });
    if (!stock) return;
    const available = availableQuantity(Number(stock.quantity), Number(stock.reservedQuantity));
    if (available <= Number(product.reorderLevel)) {
      await tx.notification.create({
        data: {
          organizationId,
          type: "LOW_STOCK_ALERT",
          title: `Low stock: ${product.name}`,
          body: `Available ${available} is at or below reorder level ${product.reorderLevel} (SKU ${product.sku}).`,
        },
      });
    }
  }

  async produceGoods(
    organizationId: string,
    createdById: string,
    dto: {
      productId: string;
      warehouseId: string;
      quantityProduced: number;
      laborCost?: number;
      overheadCost?: number;
      notes?: string;
    },
  ) {
    if (!dto.productId || !dto.warehouseId || !dto.quantityProduced || dto.quantityProduced <= 0) {
      throw new BadRequestException("Product ID, Warehouse ID, and positive quantityProduced are required.");
    }

    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const parent = await tx.product.findFirst({
        where: { id: dto.productId, organizationId },
        include: {
          components: {
            include: {
              child: true,
            },
          },
        },
      });

      if (!parent) throw new NotFoundException("Finished good product not found");
      if (!parent.components || parent.components.length === 0) {
        throw new BadRequestException(
          `Product "${parent.name}" does not have any recipe / Bill of Materials (BOM) components configured. Please define raw materials in the Product recipe first.`
        );
      }

      const warehouse = await tx.warehouse.findFirst({
        where: { id: dto.warehouseId, organizationId },
      });
      if (!warehouse) throw new NotFoundException("Warehouse not found");

      const runNumber = `PROD-${Date.now().toString().slice(-6)}`;
      let consumedMaterialCost = 0;

      // 1. Check and deduct each component (Raw Material / Consumable)
      for (const comp of parent.components) {
        const requiredQty = round4(comp.quantity * dto.quantityProduced);
        const rawStock = await this.lockStock(tx, organizationId, comp.childProductId, dto.warehouseId);
        const cur = this.snapshot(rawStock);
        const avail = availableQuantity(cur.quantity, cur.reservedQuantity);

        if (avail < requiredQty && !org.allowNegativeStock) {
          throw new BadRequestException(
            `Insufficient stock for raw material "${comp.child?.name || comp.childProductId}". Required: ${requiredQty}, Available: ${avail}`
          );
        }

        const next = applyDecrease(cur, requiredQty, org.allowNegativeStock);
        await tx.inventoryStock.update({
          where: { id: rawStock.id },
          data: { quantity: next.quantity, reservedQuantity: next.reservedQuantity },
        });

        await this.writeLedger(tx, {
          organizationId,
          productId: comp.childProductId,
          warehouseId: dto.warehouseId,
          type: "PRODUCTION_CONSUMPTION" as InventoryTxnType,
          referenceType: "production_run",
          referenceId: runNumber,
          quantity: requiredQty,
          before: cur.quantity,
          after: next.quantity,
          signedQty: -requiredQty,
          createdById,
          reason: `Consumed ${requiredQty} for producing ${dto.quantityProduced} units of ${parent.name} (${runNumber})`,
        });

        consumedMaterialCost += round4(requiredQty * (comp.child?.costPrice ?? 0));
        await this.maybeLowStockAlert(tx, organizationId, comp.childProductId, dto.warehouseId);
      }

      // 2. Add finished good to warehouse stock
      const fgStock = await this.lockStock(tx, organizationId, dto.productId, dto.warehouseId);
      const fgCur = this.snapshot(fgStock);
      const fgNext = applyIncrease(fgCur, dto.quantityProduced);

      await tx.inventoryStock.update({
        where: { id: fgStock.id },
        data: { quantity: fgNext.quantity, reservedQuantity: fgNext.reservedQuantity },
      });

      await this.writeLedger(tx, {
        organizationId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        type: "PRODUCTION_OUTPUT" as InventoryTxnType,
        referenceType: "production_run",
        referenceId: runNumber,
        quantity: dto.quantityProduced,
        before: fgCur.quantity,
        after: fgNext.quantity,
        signedQty: dto.quantityProduced,
        createdById,
        reason: `Production output: ${dto.quantityProduced} units manufactured (${runNumber})`,
      });

      // 3. Compute cost metrics
      const laborCost = Number(dto.laborCost ?? 0);
      const overheadCost = Number(dto.overheadCost ?? 0);
      const totalCost = round4(consumedMaterialCost + laborCost + overheadCost);
      const unitCost = round4(totalCost / dto.quantityProduced);

      if (unitCost > 0) {
        await tx.product.update({
          where: { id: dto.productId },
          data: { costPrice: unitCost },
        });
      }

      // 4. Record production run
      const run = await tx.productionRun.create({
        data: {
          organizationId,
          runNumber,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantityProduced: dto.quantityProduced,
          laborCost,
          overheadCost,
          totalCost,
          unitCost,
          notes: dto.notes,
          producedById: createdById,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true, classification: true },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      return run;
    });
  }

  async listProductionRuns(organizationId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.productionRun.count({ where: { organizationId } }),
      this.prisma.productionRun.findMany({
        where: { organizationId },
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);
    return { data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  async getProductionFeasibility(organizationId: string, productId: string, warehouseId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
      include: {
        components: {
          include: {
            child: {
              include: {
                stocks: warehouseId ? { where: { warehouseId } } : true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException("Product not found");
    if (!product.components.length) {
      return {
        productId,
        productName: product.name,
        canProduce: 0,
        bottlenecks: [],
        components: [],
        hasRecipe: false,
      };
    }

    let maxPossible = Infinity;
    const componentDetails = product.components.map((comp) => {
      const totalAvailable = comp.child.stocks.reduce((acc, s) => {
        return acc + Math.max(0, Number(s.quantity) - Number(s.reservedQuantity));
      }, 0);
      const possibleWithThis = comp.quantity > 0 ? Math.floor(totalAvailable / comp.quantity) : Infinity;
      if (possibleWithThis < maxPossible) {
        maxPossible = possibleWithThis;
      }
      return {
        childProductId: comp.childProductId,
        childName: comp.child.name,
        childSku: comp.child.sku,
        unit: comp.child.unit?.name || "Units",
        costPrice: comp.child.costPrice,
        recipeQty: comp.quantity,
        availableStock: totalAvailable,
        possibleProduction: possibleWithThis,
      };
    });

    const canProduce = maxPossible === Infinity ? 0 : maxPossible;
    const bottlenecks = componentDetails.filter((c) => c.possibleProduction === canProduce);

    return {
      productId,
      productName: product.name,
      canProduce,
      bottlenecks,
      components: componentDetails,
      hasRecipe: true,
    };
  }

  async postDailyProductionLog(
    organizationId: string,
    createdById: string,
    dto: {
      warehouseId: string;
      date?: string;
      notes?: string;
      outwards: Array<{ productId: string; quantity: number }>;
      inwards: Array<{ productId: string; quantity: number }>;
    },
  ) {
    if (!dto.warehouseId) throw new BadRequestException("Warehouse is required.");
    const validOutwards = (dto.outwards ?? []).filter((o) => o.productId && Number(o.quantity) > 0);
    const validInwards = (dto.inwards ?? []).filter((i) => i.productId && Number(i.quantity) > 0);

    if (validOutwards.length === 0) {
      throw new BadRequestException("At least one outward finished product with quantity is required.");
    }
    if (validInwards.length === 0) {
      throw new BadRequestException("At least one inward raw material consumed with quantity is required.");
    }

    const entryDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const wh = await tx.warehouse.findFirst({ where: { id: dto.warehouseId, organizationId } });
      if (!wh) throw new NotFoundException("Warehouse not found");

      const logBatchNumber = `DLOG-${entryDate.getFullYear()}${String(entryDate.getMonth() + 1).padStart(2, "0")}${String(entryDate.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Process Inwards (Raw materials consumed today)
      for (const inward of validInwards) {
        const matStock = await this.lockStock(tx, organizationId, inward.productId, dto.warehouseId);
        const cur = this.snapshot(matStock);
        const next = applyDecrease(cur, Number(inward.quantity), org.allowNegativeStock ?? true);

        await tx.inventoryStock.update({
          where: { id: matStock.id },
          data: { quantity: next.quantity, reservedQuantity: next.reservedQuantity },
        });

        await this.writeLedger(tx, {
          organizationId,
          productId: inward.productId,
          warehouseId: dto.warehouseId,
          type: "PRODUCTION_CONSUMPTION" as InventoryTxnType,
          referenceType: "daily_log",
          referenceId: logBatchNumber,
          quantity: Number(inward.quantity),
          before: cur.quantity,
          after: next.quantity,
          signedQty: -Number(inward.quantity),
          createdById,
          reason: `Daily factory log: Consumed in production (${logBatchNumber})${dto.notes ? " - " + dto.notes : ""}`,
        });

        await this.maybeLowStockAlert(tx, organizationId, inward.productId, dto.warehouseId);
      }

      // 2. Process Outwards (Finished goods ready today)
      const createdRuns = [];
      for (const outward of validOutwards) {
        const fgStock = await this.lockStock(tx, organizationId, outward.productId, dto.warehouseId);
        const cur = this.snapshot(fgStock);
        const next = applyIncrease(cur, Number(outward.quantity));

        await tx.inventoryStock.update({
          where: { id: fgStock.id },
          data: { quantity: next.quantity, reservedQuantity: next.reservedQuantity },
        });

        const runNumber = `PR-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

        await this.writeLedger(tx, {
          organizationId,
          productId: outward.productId,
          warehouseId: dto.warehouseId,
          type: "PRODUCTION_OUTPUT" as InventoryTxnType,
          referenceType: "daily_log",
          referenceId: runNumber,
          quantity: Number(outward.quantity),
          before: cur.quantity,
          after: next.quantity,
          signedQty: Number(outward.quantity),
          createdById,
          reason: `Daily factory log: Produced finished good (${logBatchNumber} / ${runNumber})${dto.notes ? " - " + dto.notes : ""}`,
        });

        const run = await tx.productionRun.create({
          data: {
            organizationId,
            runNumber,
            productId: outward.productId,
            warehouseId: dto.warehouseId,
            quantityProduced: Number(outward.quantity),
            notes: `Daily Log ${logBatchNumber}${dto.notes ? " - " + dto.notes : ""}`,
            producedById: createdById,
            createdAt: entryDate,
          },
        });
        createdRuns.push(run);
      }

      return {
        success: true,
        logBatchNumber,
        date: entryDate,
        outwardCount: validOutwards.length,
        inwardCount: validInwards.length,
        runs: createdRuns,
      };
    });
  }

  async getMonthlyProductionAnalytics(
    organizationId: string,
    year: number,
    month: number,
    warehouseId?: string,
  ) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const txns = await this.prisma.inventoryTransaction.findMany({
      where: {
        organizationId,
        ...(warehouseId ? { warehouseId } : {}),
        type: { in: ["PRODUCTION_OUTPUT", "PRODUCTION_CONSUMPTION"] as any },
        createdAt: { gte: start, lt: end },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, classification: true, costPrice: true, description: true },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalOutwardUnits = 0;
    let totalInwardUnits = 0;
    const outwardMap = new Map<string, { id: string; name: string; sku: string; unit: string; totalQty: number }>();
    const inwardMap = new Map<string, { id: string; name: string; sku: string; unit: string; totalQty: number; estimatedCost: number }>();
    const dayMap = new Map<string, { date: string; dayLabel: string; outwards: number; inwards: number }>();
    const activeDates = new Set<string>();

    for (const t of txns) {
      const p = t.product;
      const unitMatch = p?.description?.match(/Unit:\s*([a-zA-Z0-9]+)/);
      const unit = unitMatch ? unitMatch[1] : (p?.classification === "CONSUMABLE" ? "cylinder" : p?.classification === "FINISHED_GOOD" ? "box" : "kg");

      const dateStr = t.createdAt.toISOString().slice(0, 10);
      activeDates.add(dateStr);

      if (!dayMap.has(dateStr)) {
        const d = new Date(t.createdAt);
        dayMap.set(dateStr, {
          date: dateStr,
          dayLabel: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          outwards: 0,
          inwards: 0,
        });
      }
      const dayEntry = dayMap.get(dateStr)!;

      if (t.type === "PRODUCTION_OUTPUT") {
        totalOutwardUnits += t.quantity;
        dayEntry.outwards += t.quantity;

        const cur = outwardMap.get(t.productId) || {
          id: t.productId,
          name: p?.name ?? "Finished Good",
          sku: p?.sku ?? "SKU",
          unit,
          totalQty: 0,
        };
        cur.totalQty += t.quantity;
        outwardMap.set(t.productId, cur);
      } else if (t.type === "PRODUCTION_CONSUMPTION") {
        totalInwardUnits += t.quantity;
        dayEntry.inwards += t.quantity;

        const cur = inwardMap.get(t.productId) || {
          id: t.productId,
          name: p?.name ?? "Raw Material",
          sku: p?.sku ?? "SKU",
          unit,
          totalQty: 0,
          estimatedCost: 0,
        };
        cur.totalQty += t.quantity;
        cur.estimatedCost += t.quantity * (Number(p?.costPrice) || 0);
        inwardMap.set(t.productId, cur);
      }
    }

    const dailyTrend = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const outwardBreakdown = Array.from(outwardMap.values()).sort((a, b) => b.totalQty - a.totalQty);
    const inwardBreakdown = Array.from(inwardMap.values()).sort((a, b) => b.totalQty - a.totalQty);

    return {
      year,
      month,
      totalOutwardUnits,
      totalInwardUnits,
      activeProductionDays: activeDates.size,
      totalTransactions: txns.length,
      outwardBreakdown,
      inwardBreakdown,
      dailyTrend,
      recentTxns: txns.slice(0, 60).map((t) => ({
        id: t.id,
        date: t.createdAt,
        type: t.type,
        productId: t.productId,
        productName: t.product?.name ?? "Item",
        quantity: t.quantity,
        referenceId: t.referenceId,
        reason: t.reason,
      })),
    };
  }
}
