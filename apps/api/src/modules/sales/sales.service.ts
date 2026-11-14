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
import { SHIPPING_PROVIDER, PAYMENT_PROVIDER, EMAIL_PROVIDER, type ShippingProvider, type PaymentProvider, type EmailProvider } from "../integrations/providers";
import { Inject } from "@nestjs/common";
import { paginateMeta } from "../../common/pagination";

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly sequences: SequenceService,
    @Inject(SHIPPING_PROVIDER) private readonly shipping: ShippingProvider,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  async sendEstimateEmail(orgId: string, estimateId: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id: estimateId, organizationId: orgId },
      include: { customer: true, lines: true },
    });
    if (!estimate) throw new NotFoundException("Estimate not found");
    const customer = estimate.customer;
    if (!customer?.email) throw new BadRequestException(`Customer "${customer?.name ?? "Customer"}" does not have an email address.`);

    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://inventra-web.onrender.com" : (process.env.WEB_ORIGIN || "https://inventra-web.onrender.com"));
    const trackingUrl = `${frontendUrl.replace(/\/$/, "")}/track-order/${estimate.id}`;

    const subject = `Official Price Quotation Estimate ${estimate.number} - OSCAR AUTO FLUX`;
    const linesHtml = (estimate.lines ?? []).map((l: any, i: number) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${l.product?.name ?? l.description ?? "Item"}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${l.quantity}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">₹${Number(l.unitPrice).toFixed(2)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${l.taxRate}%</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">₹${Number(l.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 10px; padding: 24px; color: #1e293b; background: #ffffff;">
        <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #1e3a8a; font-size: 22px;">OSCAR AUTO FLUX</h2>
          <div style="font-size: 12px; color: #64748b;">Manufacturers of Welding Consumables | ISO 9001:2015 Company</div>
        </div>

        <p style="font-size: 14px;">Dear <strong>${customer.name}</strong>,</p>
        <p style="font-size: 13px; color: #475569;">Thank you for your interest! Below is your requested official price quotation <strong>${estimate.number}</strong>:</p>

        <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Estimate Number: <strong>${estimate.number}</strong></span>
            <span>Validity: <strong style="color: #16a34a;">Valid for 30 Days</strong></span>
          </div>
          <div>Date: <strong>{(estimate as any).date ? new Date((estimate as any).date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; width: 30px;">#</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px;">Item Description</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Qty</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Rate</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Tax %</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <div style="background: #f0fdf4; padding: 14px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: right; font-size: 16px; font-weight: bold; color: #15803d; margin-bottom: 16px;">
          Total Quote Amount: ₹${Number(estimate.total).toLocaleString("en-IN")}
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            👉 Click Here to Confirm & Track Your Order Live ➔
          </a>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Clicking this link confirms your order with our factory team and lets you track live status!
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; line-height: 1.5;">
          <strong>Factory Contact & Settlement:</strong><br />
          Phone: +91 94432 51863 | Bank: INDIAN OVERSEAS BANK | A/C: 186302000000680 | IFSC: IOBA0001863
        </div>
      </div>
    `;

    await this.email.send(customer.email, subject, html);
    return { success: true, message: `Email quotation sent to ${customer.email}` };
  }

  async trackEstimateOrOrder(idOrToken: string) {
    let order: any = null;
    let estimate: any = null;

    // 1. Try finding Estimate by ID or number
    estimate = await this.prisma.estimate.findFirst({
      where: {
        OR: [{ id: idOrToken }, { number: idOrToken }],
      },
      include: {
        customer: true,
        lines: true,
        organization: true,
      },
    });

    if (estimate) {
      // Find if a SalesOrder was already created for this estimate (search by unique estimate ID)
      order = await this.prisma.salesOrder.findFirst({
        where: {
          organizationId: estimate.organizationId,
          notes: { contains: estimate.id },
        },
        include: {
          lines: true,
          packages: { include: { lines: true } },
          shipments: { include: { lines: true } },
          customer: true,
        },
      });
    } else {
      // 2. Not an estimate; check if it's directly a SalesOrder by ID or number
      order = await this.prisma.salesOrder.findFirst({
        where: {
          OR: [{ id: idOrToken }, { number: idOrToken }],
        },
        include: {
          lines: true,
          packages: { include: { lines: true } },
          shipments: { include: { lines: true } },
          customer: true,
          organization: true,
        },
      });

      if (!order) {
        throw new NotFoundException("Order or Estimate not found. Please check your link.");
      }
    }

    const isConfirmed = Boolean(order);

    // Determine current Tracking Stage:
    // 1 = Order Confirmed
    // 2 = Packed / Prepared for dispatch
    // 3 = Out for Delivery / In Transit
    // 4 = Delivered
    let trackingStep = isConfirmed ? 1 : 0;
    if (order) {
      if (order.status === "FULFILLED") {
        trackingStep = 4;
      } else if (order.shipments && order.shipments.length > 0) {
        const shp = order.shipments[0];
        trackingStep = shp.status === "DELIVERED" ? 4 : 3;
      } else if (order.packages && order.packages.length > 0) {
        trackingStep = 2;
      } else if (order.status === "CONFIRMED" || order.status === "PARTIALLY_FULFILLED") {
        trackingStep = 1;
      }
    }

    // Active lines: from order if confirmed, else from estimate
    const activeLines = order ? order.lines : (estimate?.lines ?? []);
    const productIds = activeLines.map((l: any) => l.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, classification: true, description: true },
    });
    const pMap = new Map(products.map((p) => [p.id, p]));

    const formattedLines = activeLines.map((l: any) => {
      const prod = pMap.get(l.productId);
      const unitMatch = prod?.description?.match(/Unit:\s*([a-zA-Z0-9]+)/);
      const unit = unitMatch ? unitMatch[1] : (prod?.classification === "CONSUMABLE" ? "cylinder" : prod?.classification === "FINISHED_GOOD" ? "box" : "kg");

      return {
        id: l.id,
        productId: l.productId,
        name: prod?.name ?? l.description ?? "Factory Item",
        sku: prod?.sku ?? "SKU",
        unit,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        amount: l.amount,
      };
    });

    const activeCustomer = order?.customer || estimate?.customer || {};
    const activeShipment = order?.shipments?.[0] ?? null;
    const activePackage = order?.packages?.[0] ?? null;

    return {
      isConfirmed,
      estimate: estimate
        ? {
            id: estimate.id,
            number: estimate.number,
            date: estimate.date,
            total: estimate.total,
            subtotal: estimate.subtotal,
            tax: estimate.tax,
            status: estimate.status,
          }
        : null,
      order: order
        ? {
            id: order.id,
            number: order.number,
            status: order.status,
            date: order.date || order.createdAt,
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            notes: order.notes,
            trackingStep,
            customer: {
              name: activeCustomer?.name ?? "Customer",
              phone: activeCustomer?.phone ?? "",
              email: activeCustomer?.email ?? "",
              city: activeCustomer?.city ?? "",
              state: activeCustomer?.state ?? "Tamil Nadu",
              address: activeCustomer?.address ?? activeCustomer?.billingAddress ?? "",
            },
            lines: formattedLines,
            package: activePackage
              ? {
                  id: activePackage.id,
                  number: activePackage.number,
                  status: activePackage.status,
                  packedAt: activePackage.packedAt || activePackage.createdAt,
                }
              : null,
            shipment: activeShipment
              ? {
                  id: activeShipment.id,
                  number: activeShipment.number,
                  status: activeShipment.status,
                  carrier: activeShipment.carrier || "Factory Logistics Vehicle",
                  trackingNumber: activeShipment.trackingNumber || `TN-${Math.floor(1000 + Math.random() * 9000)}`,
                  shippedAt: activeShipment.shippedAt || activeShipment.createdAt,
                }
              : null,
            confirmedAt: order.createdAt,
          }
        : {
            id: null,
            number: "Pending Approval",
            status: "DRAFT",
            date: estimate?.date || new Date(),
            total: estimate?.total ?? 0,
            subtotal: estimate?.subtotal ?? 0,
            tax: estimate?.tax ?? 0,
            notes: estimate?.notes ?? "",
            trackingStep: 0,
            customer: {
              name: activeCustomer?.name ?? "Customer",
              phone: activeCustomer?.phone ?? "",
              email: activeCustomer?.email ?? "",
              city: activeCustomer?.city ?? "",
              state: activeCustomer?.state ?? "Tamil Nadu",
              address: activeCustomer?.address ?? activeCustomer?.billingAddress ?? "",
            },
            lines: formattedLines,
            package: null,
            shipment: null,
            confirmedAt: null,
          },
      factory: {
        name: "OSCAR AUTO FLUX",
        tagline: "Industrial Welding Consumables & Autoflex Manufacturer",
        supportPhone: "+91 94432 51863",
        supportEmail: "support@oscarautoflux.com",
        address: "SF No. 248/2, Trichy Main Road, Coimbatore, Tamil Nadu 641005",
        gstin: "33AABCO1234F1Z5",
      },
    };
  }

  async confirmEstimateByCustomer(idOrToken: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: {
        OR: [{ id: idOrToken }, { number: idOrToken }],
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    if (!estimate) {
      // Check if it's already an active order
      const existingOrder = await this.prisma.salesOrder.findFirst({
        where: {
          OR: [{ id: idOrToken }, { number: idOrToken }],
        },
      });
      if (existingOrder) {
        return {
          success: true,
          alreadyConfirmed: true,
          message: "Order was already confirmed previously.",
          orderId: existingOrder.id,
        };
      }
      throw new NotFoundException("Estimate quotation not found.");
    }

    // Check if an order already exists for this estimate
    const existingOrder = await this.prisma.salesOrder.findFirst({
      where: {
        organizationId: estimate.organizationId,
        notes: { contains: estimate.id },
      },
    });

    if (existingOrder) {
      return {
        success: true,
        alreadyConfirmed: true,
        message: "Order was already confirmed previously.",
        orderId: existingOrder.id,
        orderNumber: existingOrder.number,
      };
    }

    // Find or create default warehouse
    let warehouseId: string;
    const wh = await this.prisma.warehouse.findFirst({
      where: { organizationId: estimate.organizationId },
    });
    if (wh) {
      warehouseId = wh.id;
    } else {
      const defaultWh = await this.prisma.warehouse.create({
        data: {
          organizationId: estimate.organizationId,
          name: "Main Factory Warehouse",
          code: "MAIN",
          address: "Main Factory Plant",
        },
      });
      warehouseId = defaultWh.id;
    }

    // Generate SO number
    const soNumber = await this.sequences.nextInTx(this.prisma, estimate.organizationId, "SO", "SO");

    // Create confirmed Sales Order
    const newOrder = await this.prisma.salesOrder.create({
      data: {
        organizationId: estimate.organizationId,
        number: soNumber,
        customerId: estimate.customerId,
        warehouseId,
        status: "CONFIRMED",
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        discount: estimate.discount,
        total: estimate.total,
        notes: `Customer approved quotation via public link EST_REF:${estimate.id} from ${estimate.number} on ${new Date().toISOString()}`,
        lines: {
          create: (estimate.lines ?? []).map((l: any) => ({
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

    // Update estimate status to ACCEPTED
    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "ACCEPTED" },
    });

    return {
      success: true,
      alreadyConfirmed: false,
      message: "Order confirmed successfully! Production team has been notified.",
      orderId: newOrder.id,
      orderNumber: newOrder.number,
    };
  }

  async convertEstimateToSalesOrder(orgId: string, estimateId: string, warehouseId?: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id: estimateId, organizationId: orgId },
      include: { customer: true, lines: true },
    });
    if (!estimate) throw new NotFoundException("Estimate quotation not found");

    // Check if an order already exists for this estimate
    const existingOrder = await this.prisma.salesOrder.findFirst({
      where: {
        organizationId: orgId,
        notes: { contains: estimate.id },
      },
      include: { lines: true, customer: true },
    });
    if (existingOrder) {
      await this.prisma.estimate.update({ where: { id: estimate.id }, data: { status: "ACCEPTED" } });
      return existingOrder;
    }

    // Determine warehouse
    let whId = warehouseId;
    if (!whId) {
      const wh = await this.prisma.warehouse.findFirst({ where: { organizationId: orgId } });
      whId = wh?.id;
    }
    if (!whId) {
      const defaultWh = await this.prisma.warehouse.create({
        data: {
          organizationId: orgId,
          name: "Main Factory Warehouse",
          code: "MAIN",
          address: "Main Factory Plant",
        },
      });
      whId = defaultWh.id;
    }

    // Generate SO number
    const soNumber = await this.sequences.nextInTx(this.prisma, orgId, "SO", "SO");

    // Create confirmed Sales Order
    const newOrder = await this.prisma.salesOrder.create({
      data: {
        organizationId: orgId,
        number: soNumber,
        customerId: estimate.customerId,
        warehouseId: whId,
        status: "CONFIRMED",
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        discount: estimate.discount,
        total: estimate.total,
        notes: `Converted from Estimate Quote ${estimate.number} EST_REF:${estimate.id}`,
        lines: {
          create: (estimate.lines ?? []).map((l: any) => ({
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

    // Mark estimate as ACCEPTED
    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "ACCEPTED" },
    });

    return newOrder;
  }

  async createEstimate(orgId: string, customerId: string, lines: CreateSalesOrderDto["lines"], discount = 0) {
    const priced = await this.priceLines(orgId, lines, "sell");
    const { subtotal, tax, discount: disc, total } = documentTotals(priced, discount, 0);
    const number = await this.sequences.nextInTx(this.prisma, orgId, "EST", "EST");
    return this.prisma.estimate.create({
      data: {
        organizationId: orgId,
        number,
        customerId,
        date: new Date(),
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

  async listEstimates(orgId: string, query: { page?: number; pageSize?: number; search?: string; status?: string } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: "insensitive" } },
        { customer: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.estimate.findMany({
        where,
        select: {
          id: true, number: true, status: true, date: true, expiryDate: true,
          subtotal: true, tax: true, discount: true, total: true,
          customer: { select: { id: true, name: true, email: true, phone: true, state: true } },
          lines: { select: { id: true, productId: true, quantity: true, unitPrice: true, taxRate: true, amount: true, description: true } },
        },
        orderBy: [{ date: "desc" }, { number: "desc" }],
        skip,
        take: pageSize,
      }),
      this.prisma.estimate.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async deleteEstimate(orgId: string, id: string) {
    const est = await this.prisma.estimate.findFirst({
      where: { id, organizationId: orgId },
      include: { lines: true },
    });
    if (!est) throw new NotFoundException("Estimate not found");

    const convertedSO = await this.prisma.salesOrder.findFirst({
      where: {
        organizationId: orgId,
        notes: { contains: id },
      },
    });
    if (convertedSO) {
      throw new BadRequestException(
        `Cannot delete Estimate '${est.number}' because it has already been converted to Sales Order '${convertedSO.number}'.`,
      );
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.estimateLine.deleteMany({ where: { estimateId: id } });
      await tx.estimate.delete({ where: { id } });
    });

    return { success: true, message: `Estimate '${est.number}' deleted successfully.` };
  }

  async createSalesOrder(orgId: string, dto: CreateSalesOrderDto) {
    const rawLines = Array.isArray(dto.lines) ? dto.lines.flat(2) : [];
    const linesToProcess = rawLines.filter((l: any) => l && l.productId && Number(l.quantity) > 0);
    if (!linesToProcess.length) {
      throw new BadRequestException("At least one valid line item is required");
    }

    const priced = await this.priceLines(orgId, linesToProcess, "sell");
    const totals = documentTotals(priced, dto.discount ?? 0, dto.shipping ?? 0);
    return this.prisma.$transaction(async (tx: any) => {
      let warehouseId = dto.warehouseId;
      if (!warehouseId) {
        const wh = await tx.warehouse.findFirst({ where: { organizationId: orgId } });
        warehouseId = wh?.id;
      }
      if (!warehouseId) {
        const defaultWh = await tx.warehouse.create({
          data: {
            organizationId: orgId,
            name: "Main Factory Warehouse",
            code: "MAIN",
            address: "Main Factory Plant",
          },
        });
        warehouseId = defaultWh.id;
      }

      const number = await this.sequences.nextInTx(tx, orgId, "SO", "SO");
      return tx.salesOrder.create({
        data: {
          organizationId: orgId,
          number,
          customerId: dto.customerId,
          warehouseId,
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

  async listSalesOrders(orgId: string, query: { page?: number; pageSize?: number; search?: string; status?: string } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: "insensitive" } },
        { customer: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        select: {
          id: true, number: true, status: true, date: true, createdAt: true,
          subtotal: true, discount: true, tax: true, shipping: true, total: true, notes: true,
          warehouseId: true, customerId: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          lines: { select: { id: true, productId: true, quantity: true, fulfilledQty: true, unitPrice: true, taxRate: true, amount: true, description: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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

  async deleteSalesOrder(orgId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId: orgId },
      include: {
        packages: true,
        shipments: true,
        invoices: true,
        salesReturns: true,
        lines: true,
      },
    });
    if (!order) throw new NotFoundException("Sales order not found");

    if (order.status === "FULFILLED") {
      throw new BadRequestException(`Cannot delete Sales Order '${order.number}' because it is already fulfilled.`);
    }

    if (order.packages.length > 0) {
      throw new BadRequestException(
        `Cannot delete Sales Order '${order.number}' because ${order.packages.length} package(s) have been generated. Delete or void packages first.`,
      );
    }

    if (order.shipments.length > 0) {
      throw new BadRequestException(
        `Cannot delete Sales Order '${order.number}' because ${order.shipments.length} shipment(s) have been generated.`,
      );
    }

    if (order.invoices.length > 0) {
      throw new BadRequestException(
        `Cannot delete Sales Order '${order.number}' because ${order.invoices.length} invoice(s) are attached to it.`,
      );
    }

    if (order.salesReturns.length > 0) {
      throw new BadRequestException(
        `Cannot delete Sales Order '${order.number}' because sales return records exist for it.`,
      );
    }

    if (order.status === "CONFIRMED" || order.status === "PARTIALLY_FULFILLED") {
      await this.inventory.releaseReservations(orgId, "sales_order", id);
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
      await tx.salesOrder.delete({ where: { id } });
    });

    return { success: true, message: `Sales Order '${order.number}' deleted successfully.` };
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

    // Validate warehouse physical stock for each item being packed
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { allowNegativeStock: true },
    });
    if (!org?.allowNegativeStock) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: order.warehouseId },
        select: { name: true },
      });
      for (const line of linesToCreate) {
        const stockRow = await this.prisma.inventoryStock.findUnique({
          where: {
            organizationId_productId_warehouseId: {
              organizationId: orgId,
              productId: line.productId,
              warehouseId: order.warehouseId,
            },
          },
        });
        const currentQty = stockRow?.quantity ?? 0;
        if (currentQty < line.quantity) {
          const product = await this.prisma.product.findUnique({
            where: { id: line.productId },
            select: { name: true, sku: true },
          });
          throw new BadRequestException(
            `Cannot pack order: Finished good '${product?.name || "Product"}' has insufficient stock in warehouse '${warehouse?.name || "Main"}'. Available stock is ${currentQty}, but required is ${line.quantity}. Please record production in Manufacturing first.`
          );
        }
      }
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

  async listPackages(orgId: string, query: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        select: {
          id: true, number: true, status: true, packedAt: true, createdAt: true, salesOrderId: true,
          salesOrder: { select: { id: true, number: true, status: true, customer: { select: { id: true, name: true } } } },
          lines: { select: { id: true, productId: true, quantity: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.package.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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

    const shipmentNumber = await this.sequences.nextInTx(this.prisma, orgId, "SHP", "SHP");

    // 1. Deduct inventory first - will throw if stock is insufficient
    await this.inventory.shipReserved(
      orgId,
      pkg.salesOrder.warehouseId,
      pkg.lines.map((l: any) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      "shipment",
      shipmentNumber,
      userId,
      `ship:${pkg.id}`,
    );

    // 2. Create shipment record and mark package SHIPPED
    const shipment = await this.prisma.$transaction(async (tx: any) => {
      const row = await tx.shipment.create({
        data: {
          organizationId: orgId,
          number: shipmentNumber,
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

  async listShipments(orgId: string, query: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        select: {
          id: true, number: true, status: true, carrier: true, trackingNumber: true, shippedAt: true, createdAt: true, salesOrderId: true,
          salesOrder: { select: { id: true, number: true, customer: { select: { id: true, name: true } } } },
          lines: { select: { id: true, productId: true, quantity: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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

  async listInvoices(orgId: string, query: { page?: number; pageSize?: number; search?: string; status?: string } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: "insensitive" } },
        { customer: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        select: {
          id: true, number: true, status: true, date: true, dueDate: true, createdAt: true,
          subtotal: true, discount: true, tax: true, shipping: true, total: true, amountPaid: true,
          customerId: true, salesOrderId: true,
          customer: { select: { id: true, name: true, email: true, phone: true, state: true, gstin: true, billingAddress: true, city: true, pincode: true } },
          salesOrder: { select: { id: true, number: true, status: true } },
          lines: { select: { id: true, productId: true, description: true, quantity: true, unitPrice: true, taxRate: true, amount: true } },
          payments: { select: { id: true, amount: true, payment: { select: { id: true, amount: true, method: true, status: true, receivedAt: true } } } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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

  async listPayments(orgId: string, query: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true, amount: true, method: true, status: true, receivedAt: true, createdAt: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          allocations: { select: { id: true, invoiceId: true, amount: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
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

  listSalesReturns(orgId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    return this.prisma.salesReturn.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, number: true, status: true, reason: true, createdAt: true,
        customer: { select: { id: true, name: true } },
        lines: { select: { id: true, productId: true, quantity: true } },
      },
      skip,
      take: pageSize,
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
