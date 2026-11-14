import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { paginateMeta, PaginationQueryDto } from "../../common/pagination";
import { CreateProductDto, CreateWarehouseDto, NameDto, UnitDto, ProductQueryDto, UpdateProductDto } from "./dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private org(organizationId: string) {
    return { organizationId };
  }

  async createNamed(model: "category" | "brand", organizationId: string, dto: NameDto) {
    try {
      if (model === "category") {
        return await this.prisma.category.create({ data: { ...this.org(organizationId), name: dto.name } });
      }
      return await this.prisma.brand.create({ data: { ...this.org(organizationId), name: dto.name } });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Name already exists");
      }
      throw e;
    }
  }

  async listCategories(organizationId: string, query?: PaginationQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query?.pageSize) || 100));
    const skip = (page - 1) * pageSize;
    const where: any = this.org(organizationId);
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" } }),
      this.prisma.category.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async listBrands(organizationId: string, query?: PaginationQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query?.pageSize) || 100));
    const skip = (page - 1) * pageSize;
    const where: any = this.org(organizationId);
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" } }),
      this.prisma.brand.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  createUnit(organizationId: string, dto: UnitDto) {
    return this.prisma.unit.create({ data: { organizationId, ...dto } });
  }

  async listUnits(organizationId: string, query?: PaginationQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query?.pageSize) || 100));
    const skip = (page - 1) * pageSize;
    const where: any = this.org(organizationId);
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({ where, skip, take: pageSize }),
      this.prisma.unit.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async createWarehouse(organizationId: string, dto: CreateWarehouseDto) {
    try {
      return await this.prisma.warehouse.create({ data: { organizationId, ...dto } });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Warehouse code must be unique");
      }
      throw e;
    }
  }

  async listWarehouses(organizationId: string, query?: PaginationQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query?.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const where: any = this.org(organizationId);
    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { code: { contains: s, mode: "insensitive" } },
        { city: { contains: s, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.warehouse.count({ where }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }

  async getWarehouse(organizationId: string, id: string) {
    const row = await this.prisma.warehouse.findFirst({ where: { id, organizationId } });
    if (!row) throw new NotFoundException("Warehouse not found");
    return row;
  }

  updateWarehouse(organizationId: string, id: string, dto: Partial<CreateWarehouseDto>) {
    return this.prisma.warehouse.updateMany({ where: { id, organizationId }, data: dto }).then(async () => {
      return this.getWarehouse(organizationId, id);
    });
  }

  async createProduct(organizationId: string, dto: CreateProductDto) {
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const product = await tx.product.create({
          data: {
            organizationId,
            name: dto.name,
            sku: dto.sku,
            barcode: dto.barcode,
            description: dto.description,
            type: dto.type ?? (dto.components?.length ? "COMPOSITE" : "BASIC"),
            classification: (dto.classification as any) ?? "FINISHED_GOOD",
            categoryId: dto.categoryId,
            brandId: dto.brandId,
            unitId: dto.unitId,
            sellingPrice: dto.sellingPrice ?? 0,
            costPrice: dto.costPrice ?? 0,
            taxRate: dto.taxRate ?? 0,
            reorderLevel: dto.reorderLevel ?? 0,
            preferredVendorId: dto.preferredVendorId,
            trackInventory: dto.trackInventory ?? true,
          },
        });
        if (dto.components?.length) {
          await tx.productComponent.createMany({
            data: dto.components.map((c: any) => ({
              parentProductId: product.id,
              childProductId: c.childProductId,
              quantity: Number(c.quantity),
            })),
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: product.id },
          include: {
            components: { include: { child: true } },
            category: true,
            brand: true,
            unit: true,
            images: true,
          },
        });
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("SKU must be unique per organization");
      }
      throw e;
    }
  }

  async bulkCreateProducts(organizationId: string, items: Array<any>) {
    const createdList = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.name.trim()) continue;
      const sku = item.sku?.trim() || `SKU-${Date.now()}-${i + 1}`;
      try {
        const prod = await this.prisma.product.create({
          data: {
            organizationId,
            name: item.name.trim(),
            sku,
            description: item.description,
            sellingPrice: Number(item.sellingPrice ?? 0),
            costPrice: Number(item.costPrice ?? 0),
            taxRate: Number(item.taxRate ?? 0),
            trackInventory: true,
          },
        });
        createdList.push(prod);
      } catch (e) {
        // Skip duplicates gracefully
      }
    }
    return { count: createdList.length, products: createdList };
  }

  async listProducts(organizationId: string, query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(query.classification
        ? {
            classification: query.classification.includes(",")
              ? { in: query.classification.split(",").map((s) => s.trim()) as any }
              : (query.classification.trim() as any),
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              { barcode: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          unit: true,
          stocks: true,
          components: {
            include: {
              child: true,
            },
          },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { data, meta: paginateMeta(query.page, query.pageSize, total) };
  }

  async getProduct(organizationId: string, id: string) {
    const row = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        components: {
          include: {
            child: true,
          },
        },
        category: true,
        brand: true,
        unit: true,
        images: true,
        stocks: true,
      },
    });
    if (!row) throw new NotFoundException("Product not found");
    return row;
  }

  async updateProduct(organizationId: string, id: string, dto: UpdateProductDto) {
    await this.getProduct(organizationId, id);
    const { components, ...rest } = dto;
    await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(components !== undefined ? { type: components.length > 0 ? "COMPOSITE" : (rest.type ?? "BASIC") } : {}),
      },
    });
    if (components) {
      await this.prisma.productComponent.deleteMany({ where: { parentProductId: id } });
      if (components.length) {
        await this.prisma.productComponent.createMany({
          data: components.map((c: any) => ({
            parentProductId: id,
            childProductId: c.childProductId,
            quantity: Number(c.quantity),
          })),
        });
      }
    }
    return this.getProduct(organizationId, id);
  }

  async deleteProduct(organizationId: string, id: string) {
    const product = await this.getProduct(organizationId, id);

    // Check if this product is used as a component in another product's recipe
    const usedInRecipes = await this.prisma.productComponent.findMany({
      where: { childProductId: id },
      include: { parent: true },
    });
    if (usedInRecipes.length > 0) {
      const parentNames = usedInRecipes.map((r) => r.parent.name).join(", ");
      throw new BadRequestException(
        `Cannot delete item: It is used as a component in recipe(s) for [${parentNames}]. Remove it from the recipe first.`,
      );
    }

    // Check if this item has any transaction / order history
    const [txnCount, soCount, poCount, invCount, billCount, prodRunCount] = await Promise.all([
      this.prisma.inventoryTransaction.count({ where: { organizationId, productId: id } }),
      this.prisma.salesOrderLine.count({ where: { productId: id } }),
      this.prisma.purchaseOrderLine.count({ where: { productId: id } }),
      this.prisma.invoiceLine.count({ where: { productId: id } }),
      this.prisma.billLine.count({ where: { productId: id } }),
      this.prisma.productionRun.count({ where: { organizationId, productId: id } }),
    ]);

    const totalUsage = txnCount + soCount + poCount + invCount + billCount + prodRunCount;

    if (totalUsage > 0) {
      // Safe Archive / Deactivate to preserve historical integrity
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        deleted: false,
        archived: true,
        message: `Item has ${totalUsage} historical transaction(s) (orders/stock/production). It was deactivated (archived) to preserve audit and accounting ledgers.`,
      };
    }

    // Zero usage -> Clean hard delete
    await this.prisma.$transaction(async (tx) => {
      await tx.productComponent.deleteMany({ where: { parentProductId: id } });
      await tx.inventoryStock.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return {
      success: true,
      deleted: true,
      archived: false,
      message: `Item "${product.name}" deleted permanently.`,
    };
  }

  createCustomer(organizationId: string, data: any) {
    return this.prisma.customer.create({ data: { ...data, organizationId } });
  }
  listCustomers(organizationId: string, query: PaginationQueryDto) {
    return this.page(this.prisma.customer, organizationId, query, ["name", "email", "phone", "gstin", "city"]);
  }
  async updateCustomer(organizationId: string, id: string, data: any) {
    const exists = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!exists) throw new NotFoundException("Customer not found");
    return this.prisma.customer.update({ where: { id }, data });
  }
  createVendor(organizationId: string, data: any) {
    return this.prisma.vendor.create({ data: { ...data, organizationId } });
  }
  listVendors(organizationId: string, query: PaginationQueryDto) {
    return this.page(this.prisma.vendor, organizationId, query, ["name", "email", "phone", "gstin", "city"]);
  }
  async updateVendor(organizationId: string, id: string, data: any) {
    const exists = await this.prisma.vendor.findFirst({ where: { id, organizationId } });
    if (!exists) throw new NotFoundException("Vendor not found");
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async deleteCustomer(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!customer) throw new NotFoundException("Customer not found");

    const [soCount, invCount] = await Promise.all([
      this.prisma.salesOrder.count({ where: { organizationId, customerId: id } }),
      this.prisma.invoice.count({ where: { organizationId, customerId: id } }),
    ]);

    if (soCount > 0 || invCount > 0) {
      throw new BadRequestException(
        `Cannot delete customer '${customer.name}' because they have ${soCount} sales order(s) and ${invCount} invoice(s) on record. Historical audit records cannot be permanently deleted.`,
      );
    }

    // Delete any draft estimates for this customer before deleting customer
    await this.prisma.$transaction(async (tx: any) => {
      const estimates = await tx.estimate.findMany({ where: { organizationId, customerId: id }, select: { id: true } });
      const estIds = estimates.map((e: any) => e.id);
      if (estIds.length > 0) {
        await tx.estimateLine.deleteMany({ where: { estimateId: { in: estIds } } });
        await tx.estimate.deleteMany({ where: { id: { in: estIds } } });
      }
      await tx.customer.delete({ where: { id } });
    });

    return { success: true, message: `Customer '${customer.name}' deleted successfully.` };
  }

  async deleteVendor(organizationId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { id, organizationId } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    const [poCount, billCount] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { organizationId, vendorId: id } }),
      this.prisma.bill.count({ where: { organizationId, vendorId: id } }),
    ]);

    if (poCount > 0 || billCount > 0) {
      throw new BadRequestException(
        `Cannot delete vendor '${vendor.name}' because they have ${poCount} purchase order(s) and ${billCount} bill(s) on record. Historical purchase ledgers cannot be deleted.`,
      );
    }

    await this.prisma.vendor.delete({ where: { id } });
    return { success: true, message: `Vendor '${vendor.name}' deleted successfully.` };
  }

  async deleteWarehouse(organizationId: string, id: string) {
    const wh = await this.getWarehouse(organizationId, id);
    const count = await this.prisma.warehouse.count({ where: { organizationId } });
    if (count <= 1) {
      throw new BadRequestException("Cannot delete the only warehouse in your organization.");
    }

    const stockWithQty = await this.prisma.inventoryStock.findFirst({
      where: { organizationId, warehouseId: id, quantity: { gt: 0 } },
    });
    if (stockWithQty) {
      throw new BadRequestException(
        `Cannot delete warehouse '${wh.name}' because it currently holds non-zero physical stock. Please transfer or adjust stock out first.`,
      );
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.inventoryStock.deleteMany({ where: { warehouseId: id } });
      await tx.warehouse.delete({ where: { id } });
    });

    return { success: true, message: `Warehouse '${wh.name}' deleted successfully.` };
  }

  private async page(
    model: { count: Function; findMany: Function },
    organizationId: string,
    query: PaginationQueryDto,
    searchField: string | string[],
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };
    if (query.search?.trim()) {
      const s = query.search.trim();
      const fields = Array.isArray(searchField) ? searchField : [searchField];
      where.OR = fields.map((f) => ({ [f]: { contains: s, mode: "insensitive" } }));
    }

    const [total, data] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { data, meta: paginateMeta(page, pageSize, total) };
  }
}
