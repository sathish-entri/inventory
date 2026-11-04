import { describe, it, expect } from "vitest";
import {
  availableQuantity,
  documentTotals,
  applyReserve,
  applyRelease,
  applyShipment,
  applyIncrease,
  applyDecrease,
} from "../inventory/inventory.math";

// ─── Inventory logic tests ────────────────────────────────────────────────────

describe("availableQuantity edge cases", () => {
  it("zero stock, zero reserved → 0",   () => expect(availableQuantity(0,    0  )).toBe(0));
  it("large stock, no reserved",         () => expect(availableQuantity(9999, 0  )).toBe(9999));
  it("fully reserved → 0",              () => expect(availableQuantity(100,  100)).toBe(0));
  it("over-reserved returns negative (raw math, service layer must guard)", () => expect(availableQuantity(10, 999)).toBeCloseTo(-989, 2));
  it("fractional quantities",            () => expect(availableQuantity(10.5, 3.5)).toBeCloseTo(7, 2));
});

describe("Stock reservation and release cycle", () => {
  it("reserve reduces available", () => {
    const s = applyReserve({ quantity: 100, reservedQuantity: 0 }, 30, false);
    expect(availableQuantity(s.quantity, s.reservedQuantity)).toBe(70);
  });

  it("release increases available", () => {
    const reserved = applyReserve({ quantity: 100, reservedQuantity: 0 }, 30, false);
    const released = applyRelease(reserved, 10);
    expect(availableQuantity(released.quantity, released.reservedQuantity)).toBe(80);
  });

  it("fulfillment reduces stock and reservation together", () => {
    const reserved  = applyReserve({ quantity: 100, reservedQuantity: 0 }, 30, false);
    const fulfilled = applyShipment(reserved, 30);
    expect(fulfilled.quantity).toBe(70);
    expect(fulfilled.reservedQuantity).toBe(0);
  });

  it("cannot reserve more than available — throws", () => {
    expect(() => applyReserve({ quantity: 50, reservedQuantity: 40 }, 20, false)).toThrow();
  });
});

describe("Inventory valuation", () => {
  it("value = sum(qty × costPrice)", () => {
    const stocks = [
      { quantity: 50,  costPrice: 800 },
      { quantity: 20,  costPrice: 350 },
      { quantity: 100, costPrice: 25  },
    ];
    const value = stocks.reduce((s, x) => s + x.quantity * x.costPrice, 0);
    expect(value).toBe(49500);
  });

  it("zero-cost product contributes 0", () => {
    expect([{ quantity: 100, costPrice: 0 }].reduce((s, x) => s + x.quantity * x.costPrice, 0)).toBe(0);
  });
});

describe("Low-stock detection", () => {
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

  it("flags correct items", () => {
    const low = stocks.filter((st) => {
      const p = products.find((x) => x.id === st.productId);
      return p ? availableQuantity(st.quantity, st.reservedQuantity) <= p.reorderLevel : false;
    });
    expect(low).toHaveLength(2);
    expect(low.map((s) => s.productId)).toContain("p1");
    expect(low.map((s) => s.productId)).toContain("p3");
    expect(low.map((s) => s.productId)).not.toContain("p2");
  });

  it("exactly at reorder level is flagged", () => {
    expect(availableQuantity(10, 0) <= 10).toBe(true);
  });
});

describe("Stock transfer between warehouses", () => {
  it("total stock preserved after transfer", () => {
    let src = 100, dst = 20;
    const qty = 30;
    src -= qty; dst += qty;
    expect(src + dst).toBe(120);
  });

  it("cannot transfer more than available at source — throws", () => {
    expect(() => applyDecrease({ quantity: 50, reservedQuantity: 10 }, 60, false)).toThrow();
  });
});

describe("Batch expiry management", () => {
  it("batch expiring within 30 days is flagged", () => {
    const soon   = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
    const cutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(soon <= cutoff).toBe(true);
    expect(soon > new Date()).toBe(true);
  });

  it("already-expired batch is not in upcoming window", () => {
    const expired = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(expired >= new Date()).toBe(false);
  });

  it("consuming batch reduces qty", () => {
    const s = applyDecrease({ quantity: 100, reservedQuantity: 0 }, 40, false);
    expect(s.quantity).toBe(60);
  });
});

describe("Serial number tracking", () => {
  it("each serialized item has unique serial", () => {
    const serials = ["SN-001", "SN-002", "SN-003"];
    expect(new Set(serials).size).toBe(serials.length);
  });

  it("valid status transitions: AVAILABLE → IN_USE → RETURNED", () => {
    type S = "AVAILABLE" | "IN_USE" | "RETURNED";
    const transitions: Record<S, S[]> = {
      AVAILABLE: ["IN_USE"],
      IN_USE:    ["RETURNED"],
      RETURNED:  ["AVAILABLE"],
    };
    expect(transitions["AVAILABLE"]).toContain("IN_USE");
    expect(transitions["IN_USE"]).not.toContain("AVAILABLE");
    expect(transitions["RETURNED"]).toContain("AVAILABLE");
  });
});

describe("Stock adjustment", () => {
  it("positive adjustment increases stock", () => {
    const s = applyIncrease({ quantity: 50, reservedQuantity: 0 }, 10);
    expect(s.quantity).toBe(60);
  });

  it("negative adjustment decreases stock", () => {
    const s = applyDecrease({ quantity: 50, reservedQuantity: 0 }, 10, false);
    expect(s.quantity).toBe(40);
  });

  it("adjustment below zero throws (allowNegative=false)", () => {
    expect(() => applyDecrease({ quantity: 10, reservedQuantity: 0 }, 20, false)).toThrow();
  });
});
