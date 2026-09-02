import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { paginateMeta, PaginationQueryDto } from "../../common/pagination";
import { CreateProductDto, CreateWarehouseDto, NameDto, UnitDto } from "./dto";

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

  listCategories(organizationId: string) {
    return this.prisma.category.findMany({ where: this.org(organizationId), orderBy: { name: "asc" } });
  }
  listBrands(organizationId: string) {
    return this.prisma.brand.findMany({ where: this.org(organizationId), orderBy: { name: "asc" } });
  }
  createUnit(organizationId: string, dto: UnitDto) {
    return this.prisma.unit.create({ data: { organizationId, ...dto } });
  }
  listUnits(organizationId: string) {
    return this.prisma.unit.findMany({ where: this.org(organizationId) });
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

  listWarehouses(organizationId: string) {
    return this.prisma.warehouse.findMany({ where: this.org(organizationId), orderBy: { name: "asc" } });
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
            type: dto.type ?? "BASIC",
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
        if (dto.type === "COMPOSITE" && dto.components?.length) {
          await tx.productComponent.createMany({
            data: dto.components.map((c: any) => ({
              parentProductId: product.id,
              childProductId: c.childProductId,
              quantity: c.quantity,
            })),
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: product.id },
          include: { components: true, category: true, brand: true, unit: true, images: true },
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

  async listProducts(organizationId: string, query: PaginationQueryDto) {
    const where: Prisma.ProductWhereInput = {
      organizationId,
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
        include: { category: true, brand: true, unit: true, stocks: true },
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
      include: { components: true, category: true, brand: true, unit: true, images: true, stocks: true },
    });
    if (!row) throw new NotFoundException("Product not found");
    return row;
  }

  async updateProduct(organizationId: string, id: string, dto: Partial<CreateProductDto>) {
    await this.getProduct(organizationId, id);
    const { components, ...rest } = dto;
    await this.prisma.product.update({ where: { id }, data: rest });
    if (components) {
      await this.prisma.productComponent.deleteMany({ where: { parentProductId: id } });
      if (components.length) {
        await this.prisma.productComponent.createMany({
          data: components.map((c: any) => ({
            parentProductId: id,
            childProductId: c.childProductId,
            quantity: c.quantity,
          })),
        });
      }
    }
    return this.getProduct(organizationId, id);
  }

  createCustomer(organizationId: string, data: any) {
    return this.prisma.customer.create({ data: { ...data, organizationId } });
  }
  listCustomers(organizationId: string, query: PaginationQueryDto) {
    return this.page(this.prisma.customer, organizationId, query, "name");
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
    return this.page(this.prisma.vendor, organizationId, query, "name");
  }
  async updateVendor(organizationId: string, id: string, data: any) {
    const exists = await this.prisma.vendor.findFirst({ where: { id, organizationId } });
    if (!exists) throw new NotFoundException("Vendor not found");
    return this.prisma.vendor.update({ where: { id }, data });
  }

  private async page(
    model: { count: Function; findMany: Function },
    organizationId: string,
    query: PaginationQueryDto,
    searchField: string,
  ) {
    const where = {
      organizationId,
      ...(query.search ? { [searchField]: { contains: query.search, mode: "insensitive" } } : {}),
    };
    const total = await model.count({ where });
    const data = await model.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: "desc" },
    });
    return { data, meta: paginateMeta(query.page, query.pageSize, total) };
  }
}
