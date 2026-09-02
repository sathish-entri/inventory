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
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows
      .filter((r: any) => r.warehouseId && r.warehouseId.trim() !== "" && r.warehouse && r.product)
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
      const existing = await tx.inventoryTransaction.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: args.organizationId,
            idempotencyKey: args.idempotencyKey,
          },
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
}
