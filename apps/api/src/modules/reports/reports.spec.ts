import { describe, it, expect } from "vitest";
import { availableQuantity, documentTotals, invoiceStatusFromBalance } from "../inventory/inventory.math";

// ─── Reports / Analytics tests ───────────────────────────────────────────────

describe("Dashboard financials calculation", () => {
  const invoices = [
    { total: 21841.74, amountPaid: 21841.74, status: "PAID"    as const },
    { total: 24456.86, amountPaid: 24456.86, status: "PAID"    as const },
    { total: 30194.1,  amountPaid: 15000,    status: "PARTIALLY_PAID" as const },
    { total: 45125.64, amountPaid: 0,        status: "OVERDUE" as const },
    { total: 23100,    amountPaid: 23100,    status: "PAID"    as const },
  ];

  const bills = [
    { total: 86140, amountPaid: 86140, status: "PAID"    as const },
    { total: 40120, amountPaid: 20000, status: "PARTIALLY_PAID" as const },
    { total: 23100, amountPaid: 0,     status: "UNPAID"  as const },
  ];

  it("receivables = sum of (total - amountPaid) for unpaid invoices", () => {
    const receivables = invoices.reduce(
      (s, i) => s + Math.max(Number(i.total) - Number(i.amountPaid), 0),
      0,
    );
    // INV-003: 30194.10 - 15000 = 15194.10
    // INV-004: 45125.64 - 0     = 45125.64
    expect(receivables).toBeCloseTo(15194.1 + 45125.64, 1);
  });

  it("payables = sum of (total - amountPaid) for unpaid bills", () => {
    const payables = bills.reduce(
      (s, b) => s + Math.max(Number(b.total) - Number(b.amountPaid), 0),
      0,
    );
    // BILL-002: 40120 - 20000 = 20120
    // BILL-003: 23100 - 0     = 23100
    expect(payables).toBeCloseTo(20120 + 23100, 1);
  });

  it("totalCollected = sum of amountPaid for invoices with payment > 0", () => {
    const totalCollected = invoices
      .filter((i) => Number(i.amountPaid) > 0)
      .reduce((s, i) => s + Number(i.amountPaid), 0);
    expect(totalCollected).toBeCloseTo(21841.74 + 24456.86 + 15000 + 23100, 1);
  });

  it("totalBillsPaid = sum of amountPaid across all bills", () => {
    const totalBillsPaid = bills.reduce((s, b) => s + Number(b.amountPaid), 0);
    expect(totalBillsPaid).toBeCloseTo(86140 + 20000, 1);
  });

  it("overdueInvoices count is correct", () => {
    const overdue = invoices.filter((i) => i.status === "OVERDUE");
    expect(overdue).toHaveLength(1); // only INV-004
  });

  it("unpaidInvoices count is correct", () => {
    const unpaid = invoices.filter((i) => Number(i.total) - Number(i.amountPaid) > 0);
    expect(unpaid).toHaveLength(2); // INV-003 and INV-004
  });
});

describe("Inventory summary", () => {
  const stocks = [
    { productId: "p1", name: "Laptop",  quantity: 50,  reservedQuantity: 10, costPrice: 800 },
    { productId: "p2", name: "Monitor", quantity: 20,  reservedQuantity: 5,  costPrice: 350 },
    { productId: "p3", name: "Cable",   quantity: 100, reservedQuantity: 0,  costPrice: 25  },
  ];

  it("calculates available for each item", () => {
    expect(availableQuantity(stocks[0].quantity, stocks[0].reservedQuantity)).toBe(40);
    expect(availableQuantity(stocks[1].quantity, stocks[1].reservedQuantity)).toBe(15);
    expect(availableQuantity(stocks[2].quantity, stocks[2].reservedQuantity)).toBe(100);
  });

  it("calculates total inventory value", () => {
    const value = stocks.reduce((s, x) => s + x.quantity * x.costPrice, 0);
    expect(value).toBe(49500);
  });

  it("calculates total stock units", () => {
    const total = stocks.reduce((s, x) => s + x.quantity, 0);
    expect(total).toBe(170);
  });
});

describe("Low-stock report", () => {
  const products = [
    { id: "p1", reorderLevel: 10 },
    { id: "p2", reorderLevel: 5  },
    { id: "p3", reorderLevel: 50 },
  ];
  const stocks = [
    { productId: "p1", quantity: 8,  reservedQuantity: 0 }, // 8  ≤ 10 → LOW
    { productId: "p2", quantity: 20, reservedQuantity: 5 }, // 15 >  5 → OK
    { productId: "p3", quantity: 45, reservedQuantity: 0 }, // 45 ≤ 50 → LOW
  ];

  it("identifies low-stock items correctly", () => {
    const low = stocks.filter((st) => {
      const p = products.find((x) => x.id === st.productId);
      return p ? availableQuantity(st.quantity, st.reservedQuantity) <= p.reorderLevel : false;
    });
    expect(low).toHaveLength(2);
    expect(low.map((l) => l.productId)).toContain("p1");
    expect(low.map((l) => l.productId)).toContain("p3");
    expect(low.map((l) => l.productId)).not.toContain("p2");
  });
});

describe("Sales by customer aggregation", () => {
  const orders = [
    { customerId: "c1", total: 10000 },
    { customerId: "c1", total: 5000  },
    { customerId: "c2", total: 20000 },
    { customerId: "c3", total: 3000  },
  ];

  it("sums totals per customer correctly", () => {
    const byCustomer: Record<string, number> = {};
    for (const o of orders) {
      byCustomer[o.customerId] = (byCustomer[o.customerId] ?? 0) + o.total;
    }
    expect(byCustomer["c1"]).toBe(15000);
    expect(byCustomer["c2"]).toBe(20000);
    expect(byCustomer["c3"]).toBe(3000);
  });

  it("grand total matches sum of all orders", () => {
    expect(orders.reduce((s, o) => s + o.total, 0)).toBe(38000);
  });
});

describe("Analytics snapshot staleness check", () => {
  it("snapshot older than 24h is stale", () => {
    const snapshotTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
    const cutoff       = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(snapshotTime < cutoff).toBe(true);
  });

  it("snapshot within 24h is fresh", () => {
    const snapshotTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
    const cutoff       = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(snapshotTime >= cutoff).toBe(true);
  });
});

describe("Top products by revenue", () => {
  const salesLines = [
    { productId: "p1", name: "Laptop",  revenue: 50000, qty: 5   },
    { productId: "p2", name: "Monitor", revenue: 20000, qty: 8   },
    { productId: "p3", name: "Cable",   revenue: 3000,  qty: 100 },
  ];

  it("orders by revenue descending", () => {
    const sorted = [...salesLines].sort((a, b) => b.revenue - a.revenue);
    expect(sorted[0].name).toBe("Laptop");
    expect(sorted[1].name).toBe("Monitor");
    expect(sorted[2].name).toBe("Cable");
  });

  it("takes at most 5 items", () => {
    expect(salesLines.slice(0, 5).length).toBeLessThanOrEqual(5);
  });
});

describe("Batch expiry report", () => {
  it("only batches within 30d window returned", () => {
    const now  = new Date();
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const batches = [
      { id: "b1", expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) }, // ✓
      { id: "b2", expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }, // ✗ too far
      { id: "b3", expiresAt: new Date(Date.now() -  5 * 24 * 60 * 60 * 1000) }, // ✗ expired
    ];
    const expiringSoon = batches.filter((b) => b.expiresAt >= now && b.expiresAt <= soon);
    expect(expiringSoon).toHaveLength(1);
    expect(expiringSoon[0].id).toBe("b1");
  });
});

describe("documentTotals used in reports", () => {
  it("correctly computes invoice total for a 2-line order (18% GST, ₹250 ship)", () => {
    const r = documentTotals(
      [
        { quantity: 2, unitPrice: 5000, taxRate: 18 },
        { quantity: 1, unitPrice: 3000, taxRate: 18 },
      ],
      500, 250,
    );
    // subtotal = 10000 + 3000 = 13000
    // tax = 13000 * 0.18 = 2340
    // total = 13000 - 500 + 2340 + 250 = 15090
    expect(r.subtotal).toBeCloseTo(13000, 2);
    expect(r.tax).toBeCloseTo(2340, 2);
    expect(r.total).toBeCloseTo(15090, 2);
  });
});
