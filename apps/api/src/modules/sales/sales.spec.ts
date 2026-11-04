import { describe, it, expect } from "vitest";
import {
  documentTotals,
  invoiceStatusFromBalance,
  availableQuantity,
  applyReserve,
  applyRelease,
  applyShipment,
} from "../inventory/inventory.math";

// ─── Sales math & business-logic tests ───────────────────────────────────────

describe("Sales order total calculation", () => {
  it("basic line total without tax or shipping", () => {
    const r = documentTotals([{ quantity: 5, unitPrice: 1000, taxRate: 0 }], 0, 0);
    expect(r.subtotal).toBe(5000);
    expect(r.total).toBe(5000);
  });

  it("multi-line with 18% GST and shipping", () => {
    const r = documentTotals(
      [
        { quantity: 5, unitPrice: 1299, taxRate: 18 },
        { quantity: 3, unitPrice: 599,  taxRate: 18 },
        { quantity: 10, unitPrice: 49,  taxRate: 18 },
      ],
      0, 250,
    );
    // subtotal = 6495 + 1797 + 490 = 8782
    expect(r.subtotal).toBeCloseTo(8782, 2);
    expect(r.tax).toBeCloseTo(8782 * 0.18, 0);
    expect(r.total).toBeCloseTo(8782 + 8782 * 0.18 + 250, 0);
  });

  it("document-level discount applied before shipping", () => {
    const r = documentTotals([{ quantity: 2, unitPrice: 5000, taxRate: 0 }], 500, 200);
    // 10000 - 500 + 200 = 9700
    expect(r.total).toBe(9700);
  });

  it("mixed tax rates in same order", () => {
    const r = documentTotals(
      [
        { quantity: 1, unitPrice: 1000, taxRate: 5  },
        { quantity: 1, unitPrice: 1000, taxRate: 18 },
        { quantity: 1, unitPrice: 1000, taxRate: 28 },
      ],
      0, 0,
    );
    expect(r.tax).toBeCloseTo(50 + 180 + 280, 2);
    expect(r.total).toBeCloseTo(3510, 2);
  });

  it("zero-tax lines produce no tax", () => {
    const r = documentTotals([{ quantity: 5, unitPrice: 200, taxRate: 0 }], 0, 0);
    expect(r.tax).toBe(0);
    expect(r.total).toBe(1000);
  });

  it("subtotal is never negative", () => {
    const r = documentTotals([{ quantity: 1, unitPrice: 100, taxRate: 0 }], 0, 0);
    expect(r.subtotal).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});

describe("Invoice status transitions", () => {
  it("PAID when fully paid",                    () => expect(invoiceStatusFromBalance(5000, 5000, "SENT")).toBe("PAID"));
  it("PAID even on overpayment",                () => expect(invoiceStatusFromBalance(5000, 6000, "SENT")).toBe("PAID"));
  it("PARTIALLY_PAID when partially paid",      () => expect(invoiceStatusFromBalance(5000, 2000, "SENT")).toBe("PARTIALLY_PAID"));
  it("SENT when nothing paid and not overdue",  () => expect(invoiceStatusFromBalance(5000, 0, "SENT")).toBe("SENT"));
  it("OVERDUE preserved when status is OVERDUE",() => expect(invoiceStatusFromBalance(5000, 0, "OVERDUE")).toBe("OVERDUE"));
  it("PARTIALLY_PAID even when current=OVERDUE",() => expect(invoiceStatusFromBalance(5000, 1000, "OVERDUE")).toBe("PARTIALLY_PAID"));
});

describe("Stock reservation (sales flow)", () => {
  it("reserving stock reduces available", () => {
    const stock = applyReserve({ quantity: 100, reservedQuantity: 0 }, 40, false);
    expect(availableQuantity(stock.quantity, stock.reservedQuantity)).toBe(60);
  });

  it("releasing reservation restores available", () => {
    const reserved = applyReserve({ quantity: 100, reservedQuantity: 0 }, 30, false);
    const released = applyRelease(reserved, 10);
    expect(availableQuantity(released.quantity, released.reservedQuantity)).toBe(80);
  });

  it("cannot reserve more than available (throws)", () => {
    expect(() => applyReserve({ quantity: 50, reservedQuantity: 40 }, 20, false)).toThrow();
  });

  it("fulfillment reduces stock and clears reservation", () => {
    const reserved  = applyReserve({ quantity: 100, reservedQuantity: 0  }, 30, false);
    const fulfilled = applyShipment(reserved, 30);
    expect(fulfilled.quantity).toBe(70);
    expect(fulfilled.reservedQuantity).toBe(0);
    expect(availableQuantity(fulfilled.quantity, fulfilled.reservedQuantity)).toBe(70);
  });
});

describe("Sales return (credit note) stock math", () => {
  it("returned qty increases available", () => {
    const before = availableQuantity(50, 10); // 40
    const after  = availableQuantity(55, 10); // 45 — 5 returned
    expect(after).toBe(before + 5);
  });

  it("partial return: only partial qty added", () => {
    const before = availableQuantity(100, 20); // 80
    const after  = availableQuantity(103, 20); // 83 — 3 returned
    expect(after).toBe(before + 3);
  });
});

describe("Estimate → Sales Order total preservation", () => {
  it("converting estimate to SO keeps the same total", () => {
    const lines = [{ quantity: 2, unitPrice: 1500, taxRate: 18 }];
    expect(documentTotals(lines, 0, 0).total).toBe(documentTotals(lines, 0, 0).total);
  });
});
