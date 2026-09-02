import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { SequenceService } from "../../common/sequence.service";
import { documentTotals, invoiceStatusFromBalance, round2 } from "../inventory/inventory.math";
import {
  CreateSalesOrderDto,
  PackageDto,
  PaymentDto,
  ReturnDto,
} from "../catalog/dto";
import { SHIPPING_PROVIDER, PAYMENT_PROVIDER, type ShippingProvider, type PaymentProvider } from "../integrations/providers";
import { Inject } from "@nestjs/common";

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly sequences: SequenceService,
    @Inject(SHIPPING_PROVIDER) private readonly shipping: ShippingProvider,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  async createEstimate(orgId: string, customerId: string, lines: CreateSalesOrderDto["lines"], discount = 0) {
    const priced = await this.priceLines(orgId, lines, "sell");
    const { subtotal, tax, discount: disc, total } = documentTotals(priced, discount, 0);
    const number = await this.sequences.nextInTx(this.prisma, orgId, "EST", "EST");
    return this.prisma.estimate.create({
      data: {
        organizationId: orgId,
        number,
        customerId,
        subtotal,
        tax,
        discount: disc,
        total,
        lines: {
          create: priced.map((l: any) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            amount: l.amount,
            description: l.description,
          })),
        },
      },
      include: { lines: true, customer: true },
    });
  }

  listEstimates(orgId: string) {
    return this.prisma.estimate.findMany({
      where: { organizationId: orgId },
      include: { customer: true },
      orderBy: { date: "desc" },
    });
  }

  async createSalesOrder(orgId: string, dto: CreateSalesOrderDto) {
    if (!dto.customerId || !dto.customerId.trim()) {
      throw new BadRequestException("Customer is required");
    }
    if (!dto.warehouseId || !dto.warehouseId.trim()) {
      throw new BadRequestException("Warehouse is required");
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId: orgId },
    });
    if (!customer) throw new BadRequestException("Customer not found. Please select a valid customer.");

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId: orgId },
    });
    if (!warehouse) throw new BadRequestException("Warehouse not found. Please select a valid warehouse.");

    const rawLines = Array.isArray(dto.lines) ? dto.lines.flat(2) : [];
    const linesToProcess = rawLines.filter((l: any) => l && l.productId && Number(l.quantity) > 0);
    if (!linesToProcess.length) {
      throw new BadRequestException("At least one valid line item is required");
    }

    const priced = await this.priceLines(orgId, linesToProcess, "sell");
    const totals = documentTotals(priced, dto.discount ?? 0, dto.shipping ?? 0);
    return this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "SO", "SO");
      return tx.salesOrder.create({
        data: {
          organizationId: orgId,
          number,
          customerId: dto.customerId,
          warehouseId: dto.warehouseId,
          notes: dto.notes,
          ...totals,
          lines: {
            create: priced.map((l: any) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              amount: l.amount,
              description: l.description,
            })),
          },
        },
        include: { lines: true, customer: true },
      });
    });
  }

  listSalesOrders(orgId: string) {
    return this.prisma.salesOrder.findMany({
      where: { organizationId: orgId },
      include: { customer: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesOrder(orgId: string, id: string) {
    const row = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId: orgId },
      include: { lines: true, customer: true, packages: true, shipments: true, invoices: true },
    });
    if (!row) throw new NotFoundException("Sales order not found");
    return row;
  }

  async confirmSalesOrder(orgId: string, id: string, userId: string) {
    const order = await this.getSalesOrder(orgId, id);
    if (order.status !== "DRAFT") throw new BadRequestException("Only draft orders can be confirmed");
    await this.inventory.reserveLines(
      orgId,
      order.warehouseId,
      order.lines.map((l: any) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      "sales_order",
      order.id,
      userId,
    );
    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { lines: true },
    });
  }

  async cancelSalesOrder(orgId: string, id: string) {
    const order = await this.getSalesOrder(orgId, id);
    if (order.status === "FULFILLED") throw new BadRequestException("Cannot cancel a fulfilled order");
    if (order.status === "CONFIRMED" || order.status === "PARTIALLY_FULFILLED") {
      await this.inventory.releaseReservations(orgId, "sales_order", id);
    }
    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async createPackage(orgId: string, dto: PackageDto) {
    const order = await this.getSalesOrder(orgId, dto.salesOrderId);
    if (order.status !== "CONFIRMED" && order.status !== "PARTIALLY_FULFILLED") {
      throw new BadRequestException(`Order cannot be packed in '${order.status}' status`);
    }

    const existingPackages = await this.prisma.package.findMany({
      where: { salesOrderId: dto.salesOrderId, organizationId: orgId },
      include: { lines: true },
    });

    const packedQtyMap = new Map<string, number>();
    for (const pkg of existingPackages) {
      for (const line of pkg.lines) {
        packedQtyMap.set(line.productId, (packedQtyMap.get(line.productId) ?? 0) + Number(line.quantity));
      }
    }

    const rawLines = Array.isArray(dto.lines) ? dto.lines.flat(2) : [];
    const inputLines = rawLines.filter((l: any) => l && l.productId && Number(l.quantity) > 0);

    const linesToCreate: Array<{ productId: string; quantity: number }> = [];

    if (inputLines.length > 0) {
      for (const line of inputLines) {
        const soLine = order.lines.find((l: any) => l.productId === line.productId);
        const orderQty = Number(soLine?.quantity ?? 0);
        const alreadyPacked = packedQtyMap.get(line.productId) ?? 0;
        const maxCanPack = Math.max(0, orderQty - alreadyPacked);

        if (maxCanPack <= 0) continue;

        const packQty = Math.min(Number(line.quantity), maxCanPack);
        linesToCreate.push({ productId: line.productId, quantity: packQty });
      }
    } else {
      for (const line of order.lines) {
        const orderQty = Number(line.quantity);
        const alreadyPacked = packedQtyMap.get(line.productId) ?? 0;
        const remaining = orderQty - alreadyPacked;
        if (remaining > 0) {
          linesToCreate.push({ productId: line.productId, quantity: remaining });
        }
      }
    }

    if (linesToCreate.length === 0) {
      throw new BadRequestException("Order is already fully packed! No remaining items to pack.");
    }

    return this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "PKG", "PKG");
      return tx.package.create({
        data: {
          organizationId: orgId,
          number,
          salesOrderId: dto.salesOrderId,
          status: "PACKED",
          packedAt: new Date(),
          lines: { create: linesToCreate },
        },
        include: { lines: true },
      });
    });
  }

  listPackages(orgId: string) {
    return this.prisma.package.findMany({
      where: { organizationId: orgId },
      include: { salesOrder: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createShipment(orgId: string, packageId: string, userId: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { id: packageId, organizationId: orgId },
      include: { lines: true, salesOrder: { include: { lines: true } } },
    });
    if (!pkg) throw new NotFoundException("Package not found");
    if (pkg.status === "SHIPPED") throw new BadRequestException("Package already shipped");

    const created = await this.shipping.createShipment({
      to: pkg.salesOrder.warehouseId,
      weightKg: 1,
      reference: pkg.number,
    });

    const shipment = await this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "SHP", "SHP");
      const row = await tx.shipment.create({
        data: {
          organizationId: orgId,
          number,
          salesOrderId: pkg.salesOrderId,
          packageId: pkg.id,
          status: "CONFIRMED",
          carrier: this.shipping.name,
          trackingNumber: created.trackingNumber,
          providerRef: created.providerRef,
          shippedAt: new Date(),
          lines: {
            create: pkg.lines.map((l: any) => ({ productId: l.productId, quantity: l.quantity })),
          },
        },
        include: { lines: true },
      });
      await tx.package.update({ where: { id: pkg.id }, data: { status: "SHIPPED" } });
      return row;
    });

    await this.inventory.shipReserved(
      orgId,
      pkg.salesOrder.warehouseId,
      pkg.lines.map((l: any) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      "shipment",
      shipment.id,
      userId,
      `ship:${shipment.id}`,
    );

    for (const line of pkg.lines) {
      const soLine = pkg.salesOrder.lines.find((l: any) => l.productId === line.productId);
      if (soLine) {
        await this.prisma.salesOrderLine.update({
          where: { id: soLine.id },
          data: { fulfilledQty: { increment: Number(line.quantity) } },
        });
      }
    }
    const refreshed = await this.getSalesOrder(orgId, pkg.salesOrderId);
    const allFulfilled = refreshed.lines.every(
      (l: any) => Number(l.fulfilledQty) >= Number(l.quantity),
    );
    await this.prisma.salesOrder.update({
      where: { id: pkg.salesOrderId },
      data: { status: allFulfilled ? "FULFILLED" : "PARTIALLY_FULFILLED" },
    });
    await this.prisma.notification.create({
      data: {
        organizationId: orgId,
        type: "SHIPMENT",
        title: `Shipment ${shipment.number}`,
        body: `Tracking ${created.trackingNumber}`,
      },
    });
    return this.prisma.shipment.findUniqueOrThrow({ where: { id: shipment.id }, include: { lines: true } });
  }

  listShipments(orgId: string) {
    return this.prisma.shipment.findMany({
      where: { organizationId: orgId },
      include: { salesOrder: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInvoiceFromOrder(orgId: string, salesOrderId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { salesOrderId, organizationId: orgId },
      include: { lines: true, customer: true },
    });
    if (existing) return existing;

    const order = await this.getSalesOrder(orgId, salesOrderId);
    return this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "INV", "INV");
      const linesToCreate = (order.lines ?? []).map((l: any) => {
        const qty = Number(l.quantity || 1);
        const price = Number(l.unitPrice || 0);
        const taxRate = Number(l.taxRate || 0);
        const lineSubtotal = qty * price;
        const lineTax = lineSubtotal * (taxRate / 100);
        const lineAmt = Number(l.amount) || (lineSubtotal + lineTax);

        return {
          productId: l.productId,
          description: l.description ?? "Item",
          quantity: qty,
          unitPrice: price,
          taxRate: taxRate,
          amount: lineAmt,
        };
      });

      const invoice = await tx.invoice.create({
        data: {
          organizationId: orgId,
          number,
          customerId: order.customerId,
          salesOrderId,
          status: "SENT",
          subtotal: Number(order.subtotal || 0),
          discount: Number(order.discount || 0),
          tax: Number(order.tax || 0),
          shipping: Number(order.shipping || 0),
          total: Number(order.total || 0),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          lines: {
            create: linesToCreate,
          },
        },
        include: { lines: true, customer: true },
      });
      await tx.notification.create({
        data: {
          organizationId: orgId,
          type: "INVOICE",
          title: `Invoice ${invoice.number}`,
          body: `Invoice created for ${order.number}`,
        },
      });
      return invoice;
    });
  }

  listInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId: orgId },
      include: {
        customer: true,
        organization: true,
        lines: true,
        salesOrder: {
          include: {
            packages: true,
            shipments: true,
          },
        },
        payments: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async recordPayment(orgId: string, dto: PaymentDto) {
    const intent = await this.payments.createIntent(dto.amount, "INR", { customerId: dto.customerId });
    if (intent.status !== "SUCCEEDED") {
      throw new BadRequestException("Payment was not confirmed by provider");
    }

    const rawAllocations = Array.isArray(dto.allocations) ? dto.allocations.flat(2) : [];
    const allocsToCreate = rawAllocations
      .filter((a: any) => a && a.invoiceId)
      .map((a: any) => ({
        invoiceId: a.invoiceId,
        amount: Number(a.amount) > 0 ? Number(a.amount) : Number(dto.amount),
      }));

    if (allocsToCreate.length === 0) {
      throw new BadRequestException("Please select a valid invoice to apply this payment to.");
    }

    return this.prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          organizationId: orgId,
          customerId: dto.customerId,
          amount: dto.amount,
          method: dto.method,
          provider: this.payments.name,
          providerRef: intent.id,
          status: "SUCCEEDED",
          allocations: { create: allocsToCreate },
        },
        include: { allocations: true },
      });
      for (const alloc of allocsToCreate) {
        const invoice = await tx.invoice.findFirst({
          where: { id: alloc.invoiceId, organizationId: orgId },
        });
        if (!invoice) throw new NotFoundException("Invoice not found");
        if (invoice.status === "VOID") throw new BadRequestException("Cannot pay a void invoice");
        const amountPaid = round2(Number(invoice.amountPaid) + alloc.amount);
        const status = invoiceStatusFromBalance(Number(invoice.total), amountPaid, invoice.status);
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { amountPaid, status },
        });
      }
      await tx.notification.create({
        data: {
          organizationId: orgId,
          type: "PAYMENT",
          title: "Payment received",
          body: `${dto.amount} via ${dto.method}`,
        },
      });
      return payment;
    });
  }

  listPayments(orgId: string) {
    return this.prisma.payment.findMany({
      where: { organizationId: orgId },
      include: { customer: true, allocations: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSalesReturn(orgId: string, dto: ReturnDto, userId: string) {
    if (!dto.customerId) throw new BadRequestException("customerId is required");
    const ret = await this.prisma.$transaction(async (tx: any) => {
      const number = await this.sequences.nextInTx(tx, orgId, "SR", "SR");
      return tx.salesReturn.create({
        data: {
          organizationId: orgId,
          number,
          customerId: dto.customerId!,
          salesOrderId: dto.salesOrderId,
          warehouseId: dto.warehouseId,
          status: "APPROVED",
          reason: dto.reason,
          lines: { create: dto.lines },
        },
        include: { lines: true },
      });
    });
    return ret;
  }

  async receiveSalesReturn(orgId: string, id: string, userId: string) {
    const ret = await this.prisma.salesReturn.findFirst({
      where: { id, organizationId: orgId },
      include: { lines: true },
    });
    if (!ret) throw new NotFoundException("Sales return not found");
    if (ret.status === "COMPLETED") throw new BadRequestException("Already received");
    for (const line of ret.lines) {
      await this.inventory.salesReturnReceive({
        organizationId: orgId,
        productId: line.productId,
        warehouseId: ret.warehouseId,
        quantity: Number(line.quantity),
        type: "SALES_RETURN",
        referenceType: "sales_return",
        referenceId: ret.id,
        createdById: userId,
        idempotencyKey: `sr:${ret.id}:${line.productId}`,
      });
    }
    return this.prisma.salesReturn.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: { lines: true },
    });
  }

  listSalesReturns(orgId: string) {
    return this.prisma.salesReturn.findMany({
      where: { organizationId: orgId },
      include: { customer: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  private async priceLines(
    orgId: string,
    lines: { productId: string; quantity: number; unitPrice?: number; unitCost?: number; taxRate?: number; description?: string }[],
    mode: "sell" | "buy",
  ) {
    if (!lines || lines.length === 0) return [];
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: orgId },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const result = [];
    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) throw new NotFoundException("Product not found");
      const unitPrice = line.unitPrice ?? (mode === "sell" ? Number(product.sellingPrice) : Number(product.costPrice));
      const taxRate = line.taxRate ?? Number(product.taxRate);
      const amount = round2(line.quantity * unitPrice);
      result.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice,
        taxRate,
        amount,
        description: line.description ?? product.name,
      });
    }
    return result;
  }
}
