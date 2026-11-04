import { describe, it, expect } from "vitest";
import {
  availableQuantity,
  documentTotals,
  invoiceStatusFromBalance,
  applyReserve,
  applyRelease,
  applyShipment,
  applyIncrease,
  applyDecrease,
} from "../inventory/inventory.math";

// ─── Auth utilities & shared math ────────────────────────────────────────────

describe("Password validation helpers", () => {
  const isValidPassword = (pw: string) =>
    pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

  it("rejects passwords shorter than 8 chars",  () => expect(isValidPassword("Ab1")).toBe(false));
  it("accepts a valid password",                () => expect(isValidPassword("Abcdefg1")).toBe(true));
  it("rejects missing uppercase",               () => expect(isValidPassword("abcdefg1")).toBe(false));
  it("rejects missing digit",                   () => expect(isValidPassword("Abcdefgh")).toBe(false));
});

describe("JWT token structure", () => {
  it("should have 3 dot-separated parts", () => {
    expect("eyJhbGc.eyJzdWIiOi.SflKxwRJ".split(".")).toHaveLength(3);
  });
});

describe("Role permissions", () => {
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin:  ["catalog:write", "inventory:write", "sales:write", "purchases:write", "report:read", "admin:read"],
    staff:  ["catalog:read",  "inventory:read",  "sales:write", "purchases:write", "report:read"],
    viewer: ["catalog:read",  "inventory:read",  "report:read"],
  };

  it("admin has admin:read",               () => expect(ROLE_PERMISSIONS["admin"]).toContain("admin:read"));
  it("staff does not have admin:read",     () => expect(ROLE_PERMISSIONS["staff"]).not.toContain("admin:read"));
  it("viewer has no write permissions",    () => {
    expect(ROLE_PERMISSIONS["viewer"].some((p) => p.endsWith(":write"))).toBe(false);
  });
});

// ─── documentTotals ──────────────────────────────────────────────────────────

describe("documentTotals", () => {
  it("calculates subtotal from lines (no tax, no discount)", () => {
    const r = documentTotals(
      [
        { quantity: 2, unitPrice: 100, taxRate: 0 },
        { quantity: 3, unitPrice: 200, taxRate: 0 },
      ],
      0, 0,
    );
    expect(r.subtotal).toBe(800);
    expect(r.total).toBe(800);
  });

  it("applies 18% GST", () => {
    const r = documentTotals([{ quantity: 1, unitPrice: 1000, taxRate: 18 }], 0, 0);
    expect(r.tax).toBeCloseTo(180, 2);
    expect(r.total).toBeCloseTo(1180, 2);
  });

  it("applies document-level discount", () => {
    const r = documentTotals([{ quantity: 1, unitPrice: 1000, taxRate: 0 }], 100, 0);
    expect(r.total).toBe(900);
  });

  it("adds shipping", () => {
    const r = documentTotals([{ quantity: 1, unitPrice: 1000, taxRate: 0 }], 0, 250);
    expect(r.total).toBe(1250);
  });

  it("handles zero lines", () => {
    const r = documentTotals([], 0, 0);
    expect(r.subtotal).toBe(0);
    expect(r.total).toBe(0);
  });

  it("returns structured object with all fields", () => {
    const r = documentTotals([{ quantity: 1, unitPrice: 500, taxRate: 5 }], 50, 100);
    expect(r).toHaveProperty("subtotal");
    expect(r).toHaveProperty("tax");
    expect(r).toHaveProperty("discount");
    expect(r).toHaveProperty("shipping");
    expect(r).toHaveProperty("total");
  });
});

// ─── invoiceStatusFromBalance ─────────────────────────────────────────────────

describe("invoiceStatusFromBalance", () => {
  it("PAID when amountPaid >= total",               () => expect(invoiceStatusFromBalance(1000, 1000, "SENT")).toBe("PAID"));
  it("PAID even on overpayment",                    () => expect(invoiceStatusFromBalance(1000, 1500, "SENT")).toBe("PAID"));
  it("PARTIALLY_PAID when partially paid",          () => expect(invoiceStatusFromBalance(1000,  500, "SENT")).toBe("PARTIALLY_PAID"));
  it("SENT when nothing paid and status is SENT",   () => expect(invoiceStatusFromBalance(1000,    0, "SENT")).toBe("SENT"));
  it("OVERDUE preserved when status is OVERDUE",    () => expect(invoiceStatusFromBalance(1000,    0, "OVERDUE")).toBe("OVERDUE"));
  it("DRAFT preserved (no payment logic)",          () => expect(invoiceStatusFromBalance(1000, 1000, "DRAFT")).toBe("DRAFT"));
  it("VOID preserved (no payment logic)",           () => expect(invoiceStatusFromBalance(1000, 1000, "VOID")).toBe("VOID"));
});

// ─── availableQuantity ────────────────────────────────────────────────────────

describe("availableQuantity", () => {
  it("qty - reserved",              () => expect(availableQuantity(100, 30)).toBe(70));
  it("returns negative when over-reserved (no clamping in math fn)", () => expect(availableQuantity(10, 15)).toBeCloseTo(-5, 2));
  it("full qty when none reserved", () => expect(availableQuantity(50,  0)).toBe(50));
  it("zero stock",                  () => expect(availableQuantity(0,   0)).toBe(0));
});

// ─── applyReserve / applyRelease / applyShipment ─────────────────────────────

describe("applyReserve", () => {
  it("increases reservedQuantity", () => {
    const next = applyReserve({ quantity: 100, reservedQuantity: 20 }, 30, false);
    expect(next.reservedQuantity).toBe(50);
    expect(next.quantity).toBe(100);
  });
  it("throws when insufficient stock (allowNegative=false)", () => {
    expect(() => applyReserve({ quantity: 10, reservedQuantity: 5 }, 20, false)).toThrow();
  });
  it("allows over-reserve when allowNegative=true", () => {
    expect(() => applyReserve({ quantity: 10, reservedQuantity: 5 }, 20, true)).not.toThrow();
  });
});

describe("applyRelease", () => {
  it("decreases reservedQuantity", () => {
    const next = applyRelease({ quantity: 100, reservedQuantity: 30 }, 10);
    expect(next.reservedQuantity).toBe(20);
  });
  it("throws when releasing more than reserved", () => {
    expect(() => applyRelease({ quantity: 100, reservedQuantity: 5 }, 10)).toThrow();
  });
});

describe("applyShipment", () => {
  it("reduces both quantity and reservedQuantity", () => {
    const next = applyShipment({ quantity: 100, reservedQuantity: 50 }, 30);
    expect(next.quantity).toBe(70);
    expect(next.reservedQuantity).toBe(20);
  });
  it("throws when shipping more than reserved", () => {
    expect(() => applyShipment({ quantity: 100, reservedQuantity: 10 }, 20)).toThrow();
  });
});

describe("applyIncrease", () => {
  it("increases quantity on receipt", () => {
    const next = applyIncrease({ quantity: 50, reservedQuantity: 10 }, 30);
    expect(next.quantity).toBe(80);
    expect(next.reservedQuantity).toBe(10); // unchanged
  });
  it("throws for non-positive qty", () => {
    expect(() => applyIncrease({ quantity: 50, reservedQuantity: 0 }, 0)).toThrow();
  });
});

describe("applyDecrease", () => {
  it("decreases physical stock", () => {
    const next = applyDecrease({ quantity: 100, reservedQuantity: 20 }, 10, false);
    expect(next.quantity).toBe(90);
  });
  it("throws when going below zero (allowNegative=false)", () => {
    expect(() => applyDecrease({ quantity: 5, reservedQuantity: 0 }, 10, false)).toThrow();
  });
  it("allows negative when allowNegative=true", () => {
    expect(() => applyDecrease({ quantity: 5, reservedQuantity: 0 }, 10, true)).not.toThrow();
  });
});
