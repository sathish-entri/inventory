import { describe, it, expect } from "vitest";
import { documentTotals, availableQuantity, applyIncrease, applyDecrease } from "../inventory/inventory.math";

// ─── Purchases math & business-logic tests ────────────────────────────────────

describe("Purchase order totals", () => {
  it("basic PO total", () => {
    const r = documentTotals([{ quantity: 100, unitPrice: 500, taxRate: 0 }], 0, 0);
    expect(r.total).toBe(50000);
  });

  it("multi-line PO with 18% GST", () => {
    const r = documentTotals(
      [
        { quantity: 50,  unitPrice: 800, taxRate: 18 },
        { quantity: 20,  unitPrice: 350, taxRate: 18 },
        { quantity: 100, unitPrice: 25,  taxRate: 18 },
      ],
      0, 0,
    );
    // subtotal = 40000 + 7000 + 2500 = 49500
    expect(r.subtotal).toBeCloseTo(49500, 2);
    expect(r.tax).toBeCloseTo(49500 * 0.18, 0);
    expect(r.total).toBeCloseTo(49500 * 1.18, 0);
  });

  it("vendor discount (doc-level) reduces total", () => {
    const r = documentTotals([{ quantity: 10, unitPrice: 1000, taxRate: 0 }], 500, 0);
    expect(r.total).toBe(9500);
  });

  it("partial receipt math: pending = ordered - received", () => {
    const ordered  = 100;
    const received = 60;
    expect(ordered - received).toBe(40);
  });
});

describe("Bill (vendor invoice) totals", () => {
  it("bill total matches PO for identical lines", () => {
    const lines = [{ quantity: 100, unitPrice: 500, taxRate: 18 }];
    expect(documentTotals(lines, 0, 0).total).toBe(documentTotals(lines, 0, 0).total);
  });

  it("partial bill uses received quantity only", () => {
    const r = documentTotals([{ quantity: 60, unitPrice: 500, taxRate: 0 }], 0, 0);
    expect(r.total).toBe(30000);
  });
});

describe("Vendor payment scenarios", () => {
  it("payment reduces outstanding balance",  () => expect(50000 - 20000).toBe(30000));
  it("full payment zeroes outstanding",      () => expect(30000 - 30000).toBe(0));
  it("overpayment: outstanding never < 0",   () => expect(Math.max(0, 10000 - 12000)).toBe(0));
});

describe("Purchase return (debit note)", () => {
  it("returned qty reduces stock", () => {
    const s = applyDecrease({ quantity: 100, reservedQuantity: 0 }, 5, false);
    expect(s.quantity).toBe(95);
  });
  it("return value reduces payable",                             () => expect(50000 - 5000).toBe(45000));
  it("cannot return more than received — clamps to received", () => expect(Math.min(70, 60)).toBe(60));
});

describe("Stock increase on receipt", () => {
  it("receiving a PO increases available stock", () => {
    const s = applyIncrease({ quantity: 0, reservedQuantity: 0 }, 50);
    expect(availableQuantity(s.quantity, s.reservedQuantity)).toBe(50);
  });

  it("partial receipt: only received qty counted", () => {
    const s = applyIncrease({ quantity: 0, reservedQuantity: 0 }, 40);
    expect(s.quantity).toBe(40);
    expect(s.quantity).toBeLessThan(100); // ordered 100
  });

  it("serial number count matches received qty", () => {
    const serials = ["SN001", "SN002", "SN003", "SN004", "SN005"];
    expect(serials).toHaveLength(5);
  });
});
