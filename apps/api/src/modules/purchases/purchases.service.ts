import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { SequenceService } from "../../common/sequence.service";
import { documentTotals, round2 } from "../inventory/inventory.math";
import { CreatePurchaseOrderDto, ReceiveDto, ReturnDto } from "../catalog/dto";
import { paginateMeta } from "../../common/pagination";
import { BillQueryDto, PurchaseOrderQueryDto, PurchaseReceiveQueryDto, PurchaseReturnQueryDto } from "./dto";

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly sequences: SequenceService,
  ) {}

  async createPurchaseOrder(orgId: string, dto: CreatePurchaseOrderDto) {
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
      let number = dto.number?.trim();
      if (number) {
        const existing = await tx.purchaseOrder.findUnique({
          where: { organizationId_number: { organizationId: orgId, number } },
        });
        if (existing) {
          throw new BadRequestException(`Purchase order / bill number '${number}' already exists. Please enter a unique number.`);
        }
      } else {
        number = await this.sequences.nextInTx(tx, orgId, "PO", "PO");
      }
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

  async listPurchaseOrders(orgId: string, query: PurchaseOrderQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: "insensitive" } },
        { vendor: { name: { contains: s, mode: "insensitive" } } },
        { notes: { contains: s, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        select: {
          id: true, number: true, status: true, date: true, expectedDate: true,
          subtotal: true, tax: true, total: true, notes: true, warehouseId: true,
          vendor: { select: { id: true, name: true, email: true, phone: true } },
          lines: { select: { id: true, productId: true, quantity: true, receivedQty: true, unitCost: true, taxRate: true, amount: true } },
        },
        skip,
        take: pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async getPO(orgId: string, id: string) {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: { lines: true, vendor: true, receives: true },
    });
    if (!row) throw new NotFoundException("Purchase order not found");
    return row;
  }

  async deletePurchaseOrder(orgId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: {
        lines: true,
        receives: true,
        bills: true,
        purchaseReturns: true,
      },
    });
    if (!po) throw new NotFoundException("Purchase order not found");

    if (po.receives.length > 0 || po.lines.some((l: any) => Number(l.receivedQty) > 0) || po.status === "RECEIVED") {
      throw new BadRequestException(
        `Cannot delete Purchase Order '${po.number}' because items have already been received into warehouse inventory. Stock receipts cannot be deleted.`,
      );
    }

    if (po.bills.length > 0) {
      throw new BadRequestException(
        `Cannot delete Purchase Order '${po.number}' because ${po.bills.length} vendor bill(s) are attached. Ledger records cannot be deleted.`,
      );
    }

    if (po.purchaseReturns.length > 0) {
      throw new BadRequestException(
        `Cannot delete Purchase Order '${po.number}' because purchase return(s) exist for it.`,
      );
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
      await tx.purchaseOrder.delete({ where: { id } });
    });

    return { success: true, message: `Purchase Order '${po.number}' deleted successfully.` };
  }

  async receive(orgId: string, purchaseOrderId: string, dto: ReceiveDto, userId: string) {
    const po = await this.getPO(orgId, purchaseOrderId);
    if (po.status === "CANCELLED") throw new BadRequestException("Purchase order is cancelled");
    if (po.status === "RECEIVED") throw new BadRequestException("This purchase order has already been fully received");

    const allAlreadyReceived = po.lines.length > 0 && po.lines.every((l: any) => Number(l.receivedQty) >= Number(l.quantity));
    if (allAlreadyReceived) {
      await this.prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "RECEIVED" },
      });
      throw new BadRequestException("All items on this purchase order have already been received");
    }

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

  async listReceives(orgId: string, query: PurchaseReceiveQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };
    if (query.purchaseOrderId) where.purchaseOrderId = query.purchaseOrderId;

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: "insensitive" } },
        { purchaseOrder: { number: { contains: s, mode: "insensitive" } } },
        { purchaseOrder: { vendor: { name: { contains: s, mode: "insensitive" } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseReceive.findMany({
        where,
        select: {
          id: true, number: true, receivedAt: true, purchaseOrderId: true,
          purchaseOrder: { select: { id: true, number: true, vendor: { select: { id: true, name: true } } } },
          lines: { select: { id: true, productId: true, quantity: true, batchNumber: true } },
        },
        skip,
        take: pageSize,
        orderBy: { receivedAt: "desc" },
      }),
      this.prisma.purchaseReceive.count({ where }),
    ]);

    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async createBillFromPO(orgId: string, purchaseOrderId: string, customNumber?: string) {
    const po = await this.getPO(orgId, purchaseOrderId);
    return this.prisma.$transaction(async (tx: any) => {
      let number = customNumber?.trim();
      if (number) {
        const existing = await tx.bill.findUnique({
          where: { organizationId_number: { organizationId: orgId, number } },
        });
        if (existing) {
          throw new BadRequestException(`Bill number '${number}' already exists`);
        }
      } else if (po.number && !po.number.startsWith("PO-")) {
        const existing = await tx.bill.findUnique({
          where: { organizationId_number: { organizationId: orgId, number: po.number } },
        });
        number = existing ? await this.sequences.nextInTx(tx, orgId, "BILL", "BILL") : po.number;
      } else {
        number = await this.sequences.nextInTx(tx, orgId, "BILL", "BILL");
      }
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

  async listBills(orgId: string, query: BillQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: "insensitive" } },
        { vendor: { name: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        select: {
          id: true, number: true, status: true, date: true, dueDate: true,
          total: true, amountPaid: true, vendorId: true, purchaseOrderId: true,
          vendor: { select: { id: true, name: true, email: true, phone: true } },
          lines: { select: { id: true, productId: true, description: true, quantity: true, unitCost: true, amount: true } },
        },
        skip,
        take: pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return { data, meta: paginateMeta(page, pageSize, total) };
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

  async listPurchaseReturns(orgId: string, query: PurchaseReturnQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: "insensitive" } },
        { vendor: { name: { contains: s, mode: "insensitive" } } },
        { reason: { contains: s, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where,
        select: {
          id: true, number: true, status: true, reason: true, createdAt: true,
          vendor: { select: { id: true, name: true } },
          lines: { select: { id: true, productId: true, quantity: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseReturn.count({ where }),
    ]);

    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async getVendorPurchaseHistory(orgId: string, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: orgId },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    // 1. Fetch Purchase Orders with line items
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { vendorId, organizationId: orgId },
      include: {
        lines: true,
        receives: { select: { id: true, number: true, receivedAt: true } },
        bills: { select: { id: true, number: true, status: true, total: true, amountPaid: true } },
      },
      orderBy: { date: "desc" },
    });

    // 2. Fetch Bills with line items and payments
    const bills = await this.prisma.bill.findMany({
      where: { vendorId, organizationId: orgId },
      include: {
        lines: true,
        payments: {
          include: {
            vendorPayment: { select: { id: true, amount: true, method: true, paidAt: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // 3. Fetch Direct Vendor Payments
    const payments = await this.prisma.vendorPayment.findMany({
      where: { vendorId, organizationId: orgId },
      include: {
        allocations: {
          include: {
            bill: { select: { id: true, number: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    // 4. Resolve Product metadata across all lines
    const pIds = new Set<string>();
    purchaseOrders.forEach((po) => po.lines.forEach((l) => l.productId && pIds.add(l.productId)));
    bills.forEach((b) => b.lines.forEach((l) => l.productId && pIds.add(l.productId)));

    const products = await this.prisma.product.findMany({
      where: { id: { in: Array.from(pIds) }, organizationId: orgId },
      select: {
        id: true,
        name: true,
        sku: true,
        classification: true,
        description: true,
        unit: { select: { name: true } },
      },
    });
    const pMap = new Map(products.map((p) => [p.id, p]));

    // Format Purchase Orders with product details
    const formattedPOs = purchaseOrders.map((po) => ({
      id: po.id,
      number: po.number,
      date: po.date,
      expectedDate: po.expectedDate,
      status: po.status,
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      notes: po.notes,
      lines: po.lines.map((l) => {
        const prod = pMap.get(l.productId);
        const unitMatch = prod?.description?.match(/Unit:\s*([a-zA-Z0-9]+)/);
        const unitName = prod?.unit?.name || (unitMatch ? unitMatch[1] : (prod?.classification === "CONSUMABLE" ? "cylinder" : prod?.classification === "FINISHED_GOOD" ? "box" : "kg"));
        return {
          id: l.id,
          productId: l.productId,
          productName: prod?.name ?? "Raw Material / Consumable",
          sku: prod?.sku ?? "SKU",
          classification: prod?.classification ?? "RAW_MATERIAL",
          unit: unitName,
          quantity: l.quantity,
          receivedQty: l.receivedQty,
          unitCost: l.unitCost,
          taxRate: l.taxRate,
          amount: l.amount,
        };
      }),
      receivesCount: po.receives.length,
      bills: po.bills,
    }));

    // Format Bills with details
    const formattedBills = bills.map((b) => ({
      id: b.id,
      number: b.number,
      date: b.date,
      dueDate: b.dueDate,
      status: b.status,
      total: b.total,
      amountPaid: b.amountPaid,
      balance: Math.max(0, b.total - b.amountPaid),
      lines: b.lines.map((l) => {
        const prod = l.productId ? pMap.get(l.productId) : null;
        return {
          id: l.id,
          description: l.description,
          productName: prod?.name ?? l.description,
          sku: prod?.sku ?? "—",
          quantity: l.quantity,
          unitCost: l.unitCost,
          amount: l.amount,
        };
      }),
      payments: b.payments.map((p) => ({
        paymentId: p.vendorPayment?.id,
        amount: p.amount,
        method: p.vendorPayment?.method,
        paidAt: p.vendorPayment?.paidAt,
      })),
    }));

    // 5. Aggregate Product / Raw Material purchase analytics
    const productStatsMap = new Map<string, {
      productId: string;
      productName: string;
      sku: string;
      classification: string;
      unit: string;
      totalQty: number;
      totalSpend: number;
      ordersCount: number;
      lastDate: Date;
    }>();

    for (const po of formattedPOs) {
      for (const line of po.lines) {
        const existing = productStatsMap.get(line.productId) ?? {
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          classification: line.classification,
          unit: line.unit,
          totalQty: 0,
          totalSpend: 0,
          ordersCount: 0,
          lastDate: po.date,
        };
        existing.totalQty += line.quantity;
        existing.totalSpend += line.amount;
        existing.ordersCount += 1;
        if (new Date(po.date) > new Date(existing.lastDate)) {
          existing.lastDate = po.date;
        }
        productStatsMap.set(line.productId, existing);
      }
    }

    const itemBreakdown = Array.from(productStatsMap.values()).map((item) => ({
      ...item,
      avgUnitCost: item.totalQty > 0 ? Math.round((item.totalSpend / item.totalQty) * 100) / 100 : 0,
    }));

    // 6. Summary metrics
    const totalPurchasedAmount = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);
    const totalBilledAmount = bills.reduce((sum, b) => sum + (b.total || 0), 0);
    const directPaymentsSum = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const billPaidSum = bills.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    const totalPaidAmount = Math.max(directPaymentsSum, billPaidSum);
    const effectiveTotal = totalBilledAmount > 0 ? totalBilledAmount : totalPurchasedAmount;
    const outstandingBalance = Math.max(0, effectiveTotal - totalPaidAmount);

    const allDates = [
      ...purchaseOrders.map((p) => new Date(p.date)),
      ...bills.map((b) => new Date(b.date)),
    ].sort((a, b) => a.getTime() - b.getTime());

    return {
      vendor,
      summary: {
        totalOrdersCount: purchaseOrders.length,
        totalBillsCount: bills.length,
        totalPurchasedAmount,
        totalBilledAmount,
        totalPaidAmount,
        outstandingBalance,
        firstPurchaseDate: allDates.length > 0 ? allDates[0] : null,
        lastPurchaseDate: allDates.length > 0 ? allDates[allDates.length - 1] : null,
        averageOrderValue: purchaseOrders.length > 0 ? Math.round(totalPurchasedAmount / purchaseOrders.length) : 0,
      },
      itemBreakdown,
      purchaseOrders: formattedPOs,
      bills: formattedBills,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        paidAt: p.paidAt,
        allocations: p.allocations.map((a) => ({
          billNumber: a.bill?.number,
          amount: a.amount,
        })),
      })),
    };
  }
}
