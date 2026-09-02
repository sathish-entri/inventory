export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function availableQuantity(quantity: number, reservedQuantity: number): number {
  return round4(quantity - reservedQuantity);
}

export interface StockSnapshot {
  quantity: number;
  reservedQuantity: number;
}

export function applyReserve(
  stock: StockSnapshot,
  qty: number,
  allowNegative: boolean,
): StockSnapshot {
  if (qty <= 0) throw new Error("Reserve quantity must be positive");
  const available = availableQuantity(stock.quantity, stock.reservedQuantity);
  if (!allowNegative && available < qty) {
    throw new Error("Insufficient available stock to reserve");
  }
  return {
    quantity: stock.quantity,
    reservedQuantity: round4(stock.reservedQuantity + qty),
  };
}

export function applyRelease(stock: StockSnapshot, qty: number): StockSnapshot {
  if (qty <= 0) throw new Error("Release quantity must be positive");
  if (stock.reservedQuantity < qty) {
    throw new Error("Cannot release more than reserved");
  }
  return {
    quantity: stock.quantity,
    reservedQuantity: round4(stock.reservedQuantity - qty),
  };
}

/** Ship reserved goods: physical down, reserved down, available unchanged. */
export function applyShipment(stock: StockSnapshot, qty: number): StockSnapshot {
  if (qty <= 0) throw new Error("Shipment quantity must be positive");
  if (stock.reservedQuantity < qty) {
    throw new Error("Cannot ship more than reserved");
  }
  if (stock.quantity < qty) {
    throw new Error("Cannot ship more than physical stock");
  }
  return {
    quantity: round4(stock.quantity - qty),
    reservedQuantity: round4(stock.reservedQuantity - qty),
  };
}

export function applyIncrease(stock: StockSnapshot, qty: number): StockSnapshot {
  if (qty <= 0) throw new Error("Increase quantity must be positive");
  return {
    quantity: round4(stock.quantity + qty),
    reservedQuantity: stock.reservedQuantity,
  };
}

export function applyDecrease(
  stock: StockSnapshot,
  qty: number,
  allowNegative: boolean,
): StockSnapshot {
  if (qty <= 0) throw new Error("Decrease quantity must be positive");
  const nextQty = round4(stock.quantity - qty);
  if (!allowNegative && nextQty < 0) {
    throw new Error("Insufficient physical stock");
  }
  if (!allowNegative && nextQty < stock.reservedQuantity) {
    throw new Error("Decrease would leave reserved greater than physical stock");
  }
  return {
    quantity: nextQty,
    reservedQuantity: stock.reservedQuantity,
  };
}

export interface LineMoney {
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export function lineAmount(line: LineMoney): { amount: number; tax: number } {
  const base = round2(line.quantity * line.unitPrice);
  const tax = round2(base * (line.taxRate / 100));
  return { amount: base, tax };
}

export function documentTotals(
  lines: LineMoney[],
  discount = 0,
  shipping = 0,
): { subtotal: number; tax: number; discount: number; shipping: number; total: number } {
  const computed = lines.map(lineAmount);
  const subtotal = round2(computed.reduce((s, l) => s + l.amount, 0));
  const tax = round2(computed.reduce((s, l) => s + l.tax, 0));
  const total = round2(subtotal - discount + tax + shipping);
  return { subtotal, tax, discount: round2(discount), shipping: round2(shipping), total };
}

export function invoiceBalance(total: number, amountPaid: number): number {
  return round2(total - amountPaid);
}

export function invoiceStatusFromBalance(
  total: number,
  amountPaid: number,
  current: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID",
): "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID" {
  if (current === "VOID" || current === "DRAFT") return current;
  const paid = round2(amountPaid);
  if (paid <= 0) return current === "OVERDUE" ? "OVERDUE" : "SENT";
  if (paid < total) return "PARTIALLY_PAID";
  return "PAID";
}

export function explodeComposite(
  parentQty: number,
  components: { childProductId: string; quantity: number }[],
): { productId: string; quantity: number }[] {
  return components.map((c) => ({
    productId: c.childProductId,
    quantity: round4(parentQty * Number(c.quantity)),
  }));
}
