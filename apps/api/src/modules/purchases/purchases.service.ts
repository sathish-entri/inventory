import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { SequenceService } from "../../common/sequence.service";
import { documentTotals, round2 } from "../inventory/inventory.math";
import { CreatePurchaseOrderDto, ReceiveDto, ReturnDto } from "../catalog/dto";

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly sequences: SequenceService,
  ) {}

  async createPurchaseOrder(orgId: string, dto: CreatePurchaseOrderDto) {
    if (!dto.vendorId || !dto.vendorId.trim()) {
      throw new BadRequestException("Vendor is required");
    }
    if (!dto.warehouseId || !dto.warehouseId.trim()) {
      throw new BadRequestException("Warehouse is required");
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId: orgId },
    });
    if (!vendor) throw new BadRequestException("Vendor not found. Please select a valid vendor.");

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId: orgId },
    });
    if (!warehouse) throw new BadRequestException("Warehouse not found. Please select a valid warehouse.");

    const rawLines = Array.isArray(dto.lines) ? dto.lines.flat(2) : [];
    const linesToProcess = rawLines.filter((l: any) => l && l.productId && Number(l.quantity) > 0);
    if (!linesToProcess.length) {
      throw new BadRequestException("At least one valid line item is required");
    }

    const productIds = [...new Set(linesToProcess.map((l: any) => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: orgId },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const priced: Array<{ productId: string; quantity: number; unitCost: number; taxRate: number; amount: number }> = [];
    for (const line of linesToProcess) {
      const product = productMap.get(line.productId);
      if (!product) throw new NotFoundException("Product not found");
      const unitCost = line.unitCost ?? Number(product.costPrice);
      const taxRate = line.taxRate ?? Number(product.taxRate);
      priced.push({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost,
        taxRate,
        amount: round2(Number(line.quantity) * unitCost),
      });
    }
    const totals = documentTotals(
      priced.map((p) => ({ quantity: p.quantity, unitPrice: p.unitCost, taxRate: p.taxRate })),
    );
    return this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "PO", "PO");
      return tx.purchaseOrder.create({
        data: {
          organizationId: orgId,
          number,
          vendorId: dto.vendorId,
          warehouseId: dto.warehouseId,
          notes: dto.notes,
          status: "ISSUED",
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          lines: { create: priced },
        },
        include: { lines: true, vendor: true },
      });
    });
  }

  listPurchaseOrders(orgId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: { vendor: true, lines: true },
      orderBy: { date: "desc" },
    });
  }

  async getPO(orgId: string, id: string) {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: { lines: true, vendor: true, receives: true },
    });
    if (!row) throw new NotFoundException("Purchase order not found");
    return row;
  }

  async receive(orgId: string, purchaseOrderId: string, dto: ReceiveDto, userId: string) {
    const po = await this.getPO(orgId, purchaseOrderId);
    if (po.status === "CANCELLED") throw new BadRequestException("PO cancelled");

    const receive = await this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "PR", "PR");
      const row = await tx.purchaseReceive.create({
        data: {
          organizationId: orgId,
          number,
          purchaseOrderId,
          createdById: userId,
          lines: {
            create: dto.lines.map((l: any) => ({
              productId: l.productId,
              quantity: l.quantity,
              batchNumber: l.batchNumber,
              serialNumbers: l.serialNumbers ?? [],
            })),
          },
        },
        include: { lines: true },
      });
      for (const line of dto.lines) {
        const poLine = po.lines.find((l: any) => l.productId === line.productId);
        if (!poLine) throw new BadRequestException("Line is not on this purchase order");
        const nextReceived = Number(poLine.receivedQty) + line.quantity;
        if (nextReceived - Number(poLine.quantity) > 0.0001) {
          throw new BadRequestException("Cannot receive more than ordered");
        }
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: { receivedQty: nextReceived },
        });
        if (line.batchNumber) {
          const batch = await tx.batch.upsert({
            where: {
              organizationId_productId_batchNumber: {
                organizationId: orgId,
                productId: line.productId,
                batchNumber: line.batchNumber,
              },
            },
            create: {
              organizationId: orgId,
              productId: line.productId,
              batchNumber: line.batchNumber,
            },
            update: {},
          });
          await tx.batchStock.upsert({
            where: { batchId_warehouseId: { batchId: batch.id, warehouseId: po.warehouseId } },
            create: { batchId: batch.id, warehouseId: po.warehouseId, quantity: line.quantity },
            update: { quantity: { increment: line.quantity } },
          });
        }
        for (const serial of line.serialNumbers ?? []) {
          await tx.serialNumber.create({
            data: {
              organizationId: orgId,
              productId: line.productId,
              serial,
              status: "AVAILABLE",
              warehouseId: po.warehouseId,
            },
          });
        }
      }
      return row;
    });

    for (const line of dto.lines) {
      await this.inventory.receive({
        organizationId: orgId,
        productId: line.productId,
        warehouseId: po.warehouseId,
        quantity: line.quantity,
        type: "PURCHASE_RECEIVE",
        referenceType: "purchase_receive",
        referenceId: receive.id,
        createdById: userId,
        idempotencyKey: `pr:${receive.id}:${line.productId}`,
      });
    }

    const refreshed = await this.getPO(orgId, purchaseOrderId);
    const complete = refreshed.lines.every((l: any) => Number(l.receivedQty) >= Number(l.quantity));
    await this.prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: complete ? "RECEIVED" : "PARTIALLY_RECEIVED" },
    });
    await this.prisma.notification.create({
      data: {
        organizationId: orgId,
        type: "PURCHASE_RECEIVE",
        title: `Received ${receive.number}`,
        body: `Goods received against ${po.number}`,
      },
    });
    return receive;
  }

  listReceives(orgId: string) {
    return this.prisma.purchaseReceive.findMany({
      where: { organizationId: orgId },
      include: { purchaseOrder: true, lines: true },
      orderBy: { receivedAt: "desc" },
    });
  }

  async createBillFromPO(orgId: string, purchaseOrderId: string) {
    const po = await this.getPO(orgId, purchaseOrderId);
    return this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "BILL", "BILL");
      return tx.bill.create({
        data: {
          organizationId: orgId,
          number,
          vendorId: po.vendorId,
          purchaseOrderId,
          status: "OPEN",
          total: po.total,
          lines: {
            create: po.lines.map((l: any) => ({
              productId: l.productId,
              description: "Item",
              quantity: l.quantity,
              unitCost: l.unitCost,
              amount: l.amount,
            })),
          },
        },
        include: { lines: true, vendor: true },
      });
    });
  }

  listBills(orgId: string) {
    return this.prisma.bill.findMany({
      where: { organizationId: orgId },
      include: { vendor: true },
      orderBy: { date: "desc" },
    });
  }

  async payBill(orgId: string, billId: string, vendorId: string, amount: number, method: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findFirst({ where: { id: billId, organizationId: orgId } });
      if (!bill) throw new NotFoundException("Bill not found");
      const payment = await tx.vendorPayment.create({
        data: {
          organizationId: orgId,
          vendorId,
          amount,
          method,
          allocations: { create: [{ billId, amount }] },
        },
      });
      const amountPaid = round2(Number(bill.amountPaid) + amount);
      await tx.bill.update({
        where: { id: billId },
        data: {
          amountPaid,
          status: amountPaid >= Number(bill.total) ? "PAID" : "PARTIAL",
        },
      });
      return payment;
    });
  }

  async createPurchaseReturn(orgId: string, dto: ReturnDto, userId: string) {
    if (!dto.vendorId) throw new BadRequestException("vendorId is required");
    const ret = await this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "PRN", "PRN");
      return tx.purchaseReturn.create({
        data: {
          organizationId: orgId,
          number,
          vendorId: dto.vendorId!,
          purchaseOrderId: dto.purchaseOrderId,
          warehouseId: dto.warehouseId,
          status: "APPROVED",
          reason: dto.reason,
          lines: { create: dto.lines },
        },
        include: { lines: true },
      });
    });
    for (const line of ret.lines) {
      await this.inventory.purchaseReturnIssue({
        organizationId: orgId,
        productId: line.productId,
        warehouseId: ret.warehouseId,
        quantity: Number(line.quantity),
        type: "PURCHASE_RETURN",
        referenceType: "purchase_return",
        referenceId: ret.id,
        createdById: userId,
        idempotencyKey: `prn:${ret.id}:${line.productId}`,
      });
    }
    return this.prisma.purchaseReturn.update({
      where: { id: ret.id },
      data: { status: "COMPLETED" },
      include: { lines: true },
    });
  }

  listPurchaseReturns(orgId: string) {
    return this.prisma.purchaseReturn.findMany({
      where: { organizationId: orgId },
      include: { vendor: true, lines: true },
    });
  }
}
