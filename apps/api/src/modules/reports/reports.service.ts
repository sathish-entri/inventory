import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { availableQuantity } from "../inventory/inventory.math";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async dashboard(organizationId: string, warehouseId?: string) {
    const stockWhere: any = { organizationId };
    if (warehouseId) stockWhere.warehouseId = warehouseId;

    const soWhere: any = { organizationId, status: { not: "CANCELLED" } };

    // ── Try pre-computed snapshot first (fast path) ──────────────────────────
    // Only use snapshot when no warehouse filter is applied (snapshot is org-wide)
    if (!warehouseId) {
      const snapshot = await this.analytics.getLatestSnapshot(organizationId);
      if (snapshot) {
        // Merge with always-live UI data (recent orders, notifications, etc.)
        const [recentPayments, recentOrders, notifications, warehouses] = await Promise.all([
          this.prisma.payment.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { customer: true },
          }),
          this.prisma.salesOrder.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { customer: true },
          }),
          this.prisma.notification.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          this.prisma.warehouse.findMany({
            where: { organizationId },
            select: { id: true, name: true },
          }),
        ]);

        const salesTrend = recentOrders.map((o: any) => ({
          name: o.number,
          total: Number(o.total),
          customer: o.customer?.name ?? "—",
          date: new Date(o.createdAt).toLocaleDateString("en-IN"),
          status: o.status,
        }));
        const recentPaymentsFormatted = recentPayments.map((p: any) => ({
          customer: p.customer?.name ?? "—",
          amount: Number(p.amount),
          method: p.method,
          date: new Date(p.createdAt).toLocaleDateString("en-IN"),
        }));

        const snap = snapshot as any;
        return {
          // From snapshot (pre-computed, fast)
          totalSales: Number(snap.totalSales ?? 0),
          totalPurchases: Number(snap.totalPurchases ?? 0),
          receivables: Number(snap.receivables ?? 0),
          payables: Number(snap.payables ?? 0),
          totalCollected: Number(snap.totalCollected ?? 0),
          totalBillsPaid: Number(snap.totalBillsPaid ?? 0),
          inventoryValue: Number(snap.inventoryValue ?? 0),
          totalStockUnits: Number(snap.totalStockUnits ?? 0),
          lowStock: Number(snap.lowStockCount ?? 0),
          lowStockItems: [],
          pendingOrders: Number(snap.pendingOrderCount ?? 0),
          confirmedOrders: Number(snap.pendingOrderCount ?? 0),
          totalInvoices: Number(snap.totalInvoices ?? 0),
          unpaidInvoices: Number(snap.unpaidInvoices ?? 0),
          overdueInvoices: Number(snap.overdueInvoices ?? 0),
          totalBills: 0,
          unpaidBills: 0,
          topItems: Array.isArray(snap.topProducts) ? snap.topProducts : [],
          // Always live
          salesTrend,
          recentPayments: recentPaymentsFormatted,
          notifications,
          warehouses,
          warehouseId: null,
          warehouseName: null,
          _fromSnapshot: true,
          _snapshotAge: Math.floor((Date.now() - new Date(snap.computedAt).getTime()) / 60000) + "m",
        };
      }
    }

    // ── Live path (no snapshot, or warehouse filter) ───────────────────────
    const [
      sales,
      purchases,
      invoices,
      bills,
      stocks,
      allProducts,
      pendingOrders,
      confirmedOrders,
      recentPayments,
      recentOrders,
      notifications,
      topSalesLines,
      warehouses,
    ] = await Promise.all([
      this.prisma.salesOrder.aggregate({ where: soWhere, _sum: { total: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { organizationId }, _sum: { total: true } }),
      this.prisma.invoice.findMany({ where: { organizationId, status: { not: "VOID" } } }),
      this.prisma.bill.findMany({ where: { organizationId } }),
      this.prisma.inventoryStock.findMany({ where: stockWhere, include: { product: true } }),
      this.prisma.product.findMany({ where: { organizationId } }),
      this.prisma.salesOrder.count({ where: { organizationId, status: { in: ["CONFIRMED", "PARTIALLY_FULFILLED"] } } }),
      this.prisma.salesOrder.count({ where: { organizationId, status: "CONFIRMED" } }),
      this.prisma.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: true },
      }),
      this.prisma.salesOrder.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: true },
      }),
      this.prisma.notification.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.salesOrderLine.groupBy({
        by: ["productId"],
        where: { salesOrder: { organizationId, status: { not: "CANCELLED" } } },
        _sum: { quantity: true, amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      this.prisma.warehouse.findMany({ where: { organizationId }, select: { id: true, name: true } }),
    ]);

    const receivables = invoices.reduce((s: number, i: any) => s + Math.max(Number(i.total) - Number(i.amountPaid), 0), 0);
    const payables = bills.reduce((s: number, b: any) => s + Math.max(Number(b.total) - Number(b.amountPaid), 0), 0);
    const totalCollected = invoices.reduce((s: number, i: any) => s + Number(i.amountPaid ?? 0), 0);
    const totalBillsPaid = bills.reduce((s: number, b: any) => s + Number(b.amountPaid ?? 0), 0);

    const inventoryValue = stocks.reduce(
      (s: number, st: any) => s + Number(st.quantity) * Number(st.product?.costPrice ?? 0),
      0,
    );
    const totalStockUnits = stocks.reduce((s: number, st: any) => s + Number(st.quantity), 0);

    const lowStockItems = stocks.filter((st: any) => {
      const product = allProducts.find((p: any) => p.id === st.productId);
      if (!product) return false;
      return availableQuantity(Number(st.quantity), Number(st.reservedQuantity)) <= Number(product.reorderLevel);
    });

    // Top products by revenue
    const productIds = topSalesLines.map((l: any) => l.productId);
    const topProducts = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const topItems = topSalesLines.map((l: any) => ({
      name: topProducts.find((p: any) => p.id === l.productId)?.name ?? "Unknown",
      revenue: Number(l._sum.amount ?? 0),
      qty: Number(l._sum.quantity ?? 0),
    }));

    // Sales trend last 10 orders
    const salesTrend = recentOrders.map((o: any) => ({
      name: o.number,
      total: Number(o.total),
      customer: o.customer?.name ?? "—",
      date: new Date(o.createdAt).toLocaleDateString("en-IN"),
      status: o.status,
    }));

    // Recent payments (for cash flow)
    const recentPaymentsFormatted = recentPayments.map((p: any) => ({
      customer: p.customer?.name ?? "—",
      amount: Number(p.amount),
      method: p.method,
      date: new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));

    // Async: kick off snapshot save in background (do not await — keeps response fast)
    this.analytics.computeAndSave(organizationId).catch(() => void 0);

    return {
      // Core financials
      totalSales: Number(sales._sum.total ?? 0),
      totalPurchases: Number(purchases._sum.total ?? 0),
      receivables,
      payables,
      totalCollected,
      totalBillsPaid,
      // Inventory
      inventoryValue,
      totalStockUnits,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5).map((st: any) => ({
        name: st.product?.name ?? "Unknown",
        available: availableQuantity(Number(st.quantity), Number(st.reservedQuantity)),
        reorderLevel: Number(allProducts.find((p: any) => p.id === st.productId)?.reorderLevel ?? 5),
      })),
      // Orders
      pendingOrders,
      confirmedOrders,
      // Rich data
      topItems,
      salesTrend,
      recentPayments: recentPaymentsFormatted,
      notifications,
      warehouses,
      // Billing KPIs
      totalInvoices: invoices.length,
      unpaidInvoices: invoices.filter((i: any) => Number(i.total) - Number(i.amountPaid) > 0).length,
      overdueInvoices: invoices.filter((i: any) => {
        const due = i.dueDate ? new Date(i.dueDate) < new Date() : false;
        return due && Number(i.total) - Number(i.amountPaid) > 0;
      }).length,
      totalBills: bills.length,
      unpaidBills: bills.filter((b: any) => Number(b.total) - Number(b.amountPaid) > 0).length,
      // Warehouse info
      warehouseId: warehouseId ?? null,
      warehouseName: warehouseId ? warehouses.find((w: any) => w.id === warehouseId)?.name ?? null : null,
      _fromSnapshot: false,
    };
  }

  async inventorySummary(organizationId: string) {
    const stocks = await this.prisma.inventoryStock.findMany({
      where: { organizationId },
      include: { product: true, warehouse: true },
    });
    return stocks.map((s: any) => ({
      productId: s.productId,
      sku: s.product.sku,
      name: s.product.name,
      warehouse: s.warehouse.name,
      quantity: Number(s.quantity),
      reserved: Number(s.reservedQuantity),
      available: availableQuantity(Number(s.quantity), Number(s.reservedQuantity)),
      value: Number(s.quantity) * Number(s.product.costPrice),
    }));
  }

  async movement(organizationId: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: { organizationId },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async lowStock(organizationId: string) {
    const summary = await this.inventorySummary(organizationId);
    const products = await this.prisma.product.findMany({ where: { organizationId } });
    return summary.filter((row: any) => {
      const p = products.find((x: any) => x.id === row.productId);
      return p ? row.available <= Number(p.reorderLevel) : false;
    });
  }

  async batchExpiry(organizationId: string) {
    const now = new Date();
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.batch.findMany({
      where: { organizationId, expiresAt: { lte: soon, gte: now } },
      include: { product: true, stocks: { include: { warehouse: true } } },
    });
  }

  async serials(organizationId: string) {
    return this.prisma.serialNumber.findMany({
      where: { organizationId },
      include: { product: true },
      take: 500,
    });
  }

  async salesByCustomer(organizationId: string) {
    const orders = await this.prisma.salesOrder.groupBy({
      by: ["customerId"],
      where: { organizationId, status: { not: "CANCELLED" } },
      _sum: { total: true },
    });
    const customers = await this.prisma.customer.findMany({ where: { organizationId } });
    return orders.map((o: any) => ({
      customer: customers.find((c: any) => c.id === o.customerId)?.name,
      total: Number(o._sum.total ?? 0),
    }));
  }
}
