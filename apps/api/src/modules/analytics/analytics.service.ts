import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { availableQuantity } from "../inventory/inventory.math";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Daily cron: runs at midnight UTC ───────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailySnapshot(): Promise<void> {
    this.logger.log("Running daily analytics snapshot...");
    const orgs = await this.prisma.organization.findMany({ select: { id: true } });
    await Promise.allSettled(
      orgs.map((org) =>
        this.computeAndSave(org.id).catch((err) =>
          this.logger.error(`Snapshot failed for org ${org.id}: ${err.message}`, err.stack),
        ),
      ),
    );
    this.logger.log(`Daily analytics snapshot complete for ${orgs.length} org(s).`);
  }

  // ─── Upsert today's snapshot for one org ─────────────────────────────────
  async computeAndSave(organizationId: string): Promise<void> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const period = `${year}-${month}-${day}`;
    const snapshotDate = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()));

    const data = await this.computeLive(organizationId);

    await this.prisma.analyticsSnapshot.upsert({
      where: {
        organizationId_period_granularity: {
          organizationId,
          period,
          granularity: "daily",
        },
      },
      create: {
        organizationId,
        snapshotDate,
        period,
        granularity: "daily",
        ...data,
      },
      update: {
        ...data,
        computedAt: new Date(),
      },
    });
    this.logger.debug(`Snapshot saved for org ${organizationId} period ${period}`);
  }

  // ─── Compute live analytics for an org ───────────────────────────────────
  async computeLive(organizationId: string): Promise<Record<string, unknown>> {
    const [
      sales,
      purchases,
      invoices,
      bills,
      stocks,
      allProducts,
      soCount,
      topLines,
    ] = await Promise.all([
      this.prisma.salesOrder.aggregate({
        where: { organizationId, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      this.prisma.purchaseOrder.aggregate({
        where: { organizationId },
        _sum: { total: true },
      }),
      this.prisma.invoice.findMany({
        where: { organizationId, status: { not: "VOID" } },
        select: { total: true, amountPaid: true, dueDate: true },
      }),
      this.prisma.bill.findMany({
        where: { organizationId },
        select: { total: true, amountPaid: true },
      }),
      this.prisma.inventoryStock.findMany({
        where: { organizationId },
        select: { productId: true, quantity: true, reservedQuantity: true },
      }),
      this.prisma.product.findMany({
        where: { organizationId },
        select: { id: true, name: true, reorderLevel: true, costPrice: true },
      }),
      this.prisma.salesOrder.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.salesOrderLine.groupBy({
        by: ["productId"],
        where: { salesOrder: { organizationId, status: { not: "CANCELLED" } } },
        _sum: { amount: true, quantity: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    // Financials
    const receivables = invoices.reduce(
      (s, i) => s + Math.max(Number(i.total) - Number(i.amountPaid), 0),
      0,
    );
    const payables = bills.reduce(
      (s, b) => s + Math.max(Number(b.total) - Number(b.amountPaid), 0),
      0,
    );
    const totalCollected = invoices
      .filter((i) => Number(i.amountPaid) > 0)
      .reduce((s, i) => s + Number(i.amountPaid), 0);
    const totalBillsPaid = bills.reduce((s, b) => s + Number(b.amountPaid), 0);

    // Inventory
    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    const inventoryValue = stocks.reduce((s, st) => {
      const p = productMap.get(st.productId);
      return s + Number(st.quantity) * Number(p?.costPrice ?? 0);
    }, 0);
    const totalStockUnits = stocks.reduce((s, st) => s + Number(st.quantity), 0);
    const lowStockCount = stocks.filter((st) => {
      const p = productMap.get(st.productId);
      if (!p) return false;
      return availableQuantity(Number(st.quantity), Number(st.reservedQuantity)) <= Number(p.reorderLevel);
    }).length;

    // Order counts
    const statusMap = new Map(soCount.map((s) => [s.status, s._count._all]));
    const pendingOrderCount = (statusMap.get("CONFIRMED") ?? 0) + (statusMap.get("PARTIALLY_FULFILLED") ?? 0);
    const fulfilledOrderCount = statusMap.get("FULFILLED") ?? 0;
    const cancelledOrderCount = statusMap.get("CANCELLED") ?? 0;

    // Invoice KPIs
    const now = new Date();
    const totalInvoices = invoices.length;
    const unpaidInvoices = invoices.filter((i) => Number(i.total) - Number(i.amountPaid) > 0).length;
    const overdueInvoices = invoices.filter(
      (i) => i.dueDate && new Date(i.dueDate) < now && Number(i.total) - Number(i.amountPaid) > 0,
    ).length;

    // Top products
    const productIds = topLines.map((l) => l.productId);
    const topProds = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const topProdMap = new Map(topProds.map((p) => [p.id, p.name]));
    const topProducts = topLines.map((l) => ({
      name: topProdMap.get(l.productId) ?? "Unknown",
      revenue: Number(l._sum?.amount ?? 0),
      qty: Number(l._sum?.quantity ?? 0),
    }));

    return {
      totalSales: Number(sales._sum.total ?? 0),
      totalPurchases: Number(purchases._sum.total ?? 0),
      totalCollected,
      totalBillsPaid,
      receivables,
      payables,
      inventoryValue,
      totalStockUnits,
      lowStockCount,
      pendingOrderCount,
      fulfilledOrderCount,
      cancelledOrderCount,
      totalInvoices,
      unpaidInvoices,
      overdueInvoices,
      topProducts,
    };
  }

  // ─── Get latest cached snapshot (< 24h) ───────────────────────────────────
  async getLatestSnapshot(organizationId: string) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.analyticsSnapshot.findFirst({
      where: {
        organizationId,
        granularity: "daily",
        computedAt: { gte: cutoff },
      },
      orderBy: { snapshotDate: "desc" },
    });
  }
}

