import { describe, expect, it } from "vitest";
import {
  applyDecrease,
  applyIncrease,
  applyRelease,
  applyReserve,
  applyShipment,
  availableQuantity,
  documentTotals,
  explodeComposite,
  invoiceBalance,
  invoiceStatusFromBalance,
} from "./inventory.math";

describe("inventory engine", () => {
  it("computes available = physical - reserved", () => {
    expect(availableQuantity(100, 20)).toBe(80);
  });

  it("reserves without changing physical stock", () => {
    const next = applyReserve({ quantity: 100, reservedQuantity: 20 }, 10, false);
    expect(next).toEqual({ quantity: 100, reservedQuantity: 30 });
    expect(availableQuantity(next.quantity, next.reservedQuantity)).toBe(70);
  });

  it("prevents over-reservation", () => {
    expect(() => applyReserve({ quantity: 10, reservedQuantity: 8 }, 3, false)).toThrow(
      /Insufficient available/,
    );
  });

  it("ships reserved stock: physical and reserved decrease, available unchanged", () => {
    const reserved = applyReserve({ quantity: 100, reservedQuantity: 20 }, 10, false);
    const shipped = applyShipment(reserved, 10);
    expect(shipped).toEqual({ quantity: 90, reservedQuantity: 20 });
    expect(availableQuantity(shipped.quantity, shipped.reservedQuantity)).toBe(70);
  });

  it("prevents double shipment beyond reservation", () => {
    expect(() => applyShipment({ quantity: 100, reservedQuantity: 5 }, 10)).toThrow(
      /Cannot ship more than reserved/,
    );
  });

  it("releases reservation on cancel", () => {
    const next = applyRelease({ quantity: 100, reservedQuantity: 30 }, 10);
    expect(next).toEqual({ quantity: 100, reservedQuantity: 20 });
  });

  it("increases stock on purchase receive", () => {
    const next = applyIncrease({ quantity: 50, reservedQuantity: 5 }, 12);
    expect(next.quantity).toBe(62);
    expect(next.reservedQuantity).toBe(5);
  });

  it("prevents negative physical on decrease", () => {
    expect(() => applyDecrease({ quantity: 4, reservedQuantity: 0 }, 5, false)).toThrow(
      /Insufficient physical/,
    );
  });

  it("explodes composite BOM quantities", () => {
    expect(
      explodeComposite(2, [
        { childProductId: "a", quantity: 3 },
        { childProductId: "b", quantity: 0.5 },
      ]),
    ).toEqual([
      { productId: "a", quantity: 6 },
      { productId: "b", quantity: 1 },
    ]);
  });
});

describe("financial math", () => {
  it("computes document totals with tax, discount, shipping", () => {
    const t = documentTotals(
      [
        { quantity: 2, unitPrice: 100, taxRate: 10 },
        { quantity: 1, unitPrice: 50, taxRate: 0 },
      ],
      10,
      20,
    );
    expect(t.subtotal).toBe(250);
    expect(t.tax).toBe(20);
    expect(t.total).toBe(280);
  });

  it("updates invoice status from payments", () => {
    expect(invoiceBalance(100, 40)).toBe(60);
    expect(invoiceStatusFromBalance(100, 40, "SENT")).toBe("PARTIALLY_PAID");
    expect(invoiceStatusFromBalance(100, 100, "SENT")).toBe("PAID");
  });
});
