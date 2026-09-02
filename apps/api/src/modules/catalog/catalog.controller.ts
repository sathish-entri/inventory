import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { CatalogService } from "./catalog.service";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { RequirePermissions } from "../../common/permissions.decorator";
import { PermissionsGuard } from "../../common/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination";
import { CreateProductDto, CreateWarehouseDto, NameDto, PartyDto, UnitDto } from "./dto";

@ApiTags("catalog")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionsGuard)
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Post("categories")
  @RequirePermissions("product:create")
  createCategory(@CurrentUser() user: AuthUser, @Body() dto: NameDto) {
    return this.catalog.createNamed("category", user.organizationId, dto);
  }

  @Get("categories")
  @RequirePermissions("product:read")
  listCategories(@CurrentUser() user: AuthUser) {
    return this.catalog.listCategories(user.organizationId);
  }

  @Post("brands")
  @RequirePermissions("product:create")
  createBrand(@CurrentUser() user: AuthUser, @Body() dto: NameDto) {
    return this.catalog.createNamed("brand", user.organizationId, dto);
  }

  @Get("brands")
  @RequirePermissions("product:read")
  listBrands(@CurrentUser() user: AuthUser) {
    return this.catalog.listBrands(user.organizationId);
  }

  @Post("units")
  @RequirePermissions("product:create")
  createUnit(@CurrentUser() user: AuthUser, @Body() dto: UnitDto) {
    return this.catalog.createUnit(user.organizationId, dto);
  }

  @Get("units")
  @RequirePermissions("product:read")
  listUnits(@CurrentUser() user: AuthUser) {
    return this.catalog.listUnits(user.organizationId);
  }

  @Post("warehouses")
  @RequirePermissions("warehouse:create")
  createWarehouse(@CurrentUser() user: AuthUser, @Body() dto: CreateWarehouseDto) {
    return this.catalog.createWarehouse(user.organizationId, dto);
  }

  @Get("warehouses")
  @RequirePermissions("warehouse:read")
  listWarehouses(@CurrentUser() user: AuthUser) {
    return this.catalog.listWarehouses(user.organizationId);
  }

  @Get("warehouses/:id")
  @RequirePermissions("warehouse:read")
  getWarehouse(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.getWarehouse(user.organizationId, id);
  }

  @Patch("warehouses/:id")
  @RequirePermissions("warehouse:update")
  updateWarehouse(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.catalog.updateWarehouse(user.organizationId, id, dto);
  }

  @Post("products")
  @RequirePermissions("product:create")
  createProduct(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.catalog.createProduct(user.organizationId, dto);
  }

  @Post("products/bulk")
  @RequirePermissions("product:create")
  bulkCreateProducts(@CurrentUser() user: AuthUser, @Body() body: any) {
    const items = Array.isArray(body) ? body : (body?.items ?? []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("Payload must be a non-empty array of product objects.");
    }
    return this.catalog.bulkCreateProducts(user.organizationId, items);
  }

  @Get("products")
  @RequirePermissions("product:read")
  listProducts(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.catalog.listProducts(user.organizationId, query);
  }

  @Get("products/:id")
  @RequirePermissions("product:read")
  getProduct(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.getProduct(user.organizationId, id);
  }

  @Patch("products/:id")
  @RequirePermissions("product:update")
  updateProduct(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CreateProductDto) {
    return this.catalog.updateProduct(user.organizationId, id, dto);
  }

  @Post("customers")
  @RequirePermissions("customer:create")
  createCustomer(@CurrentUser() user: AuthUser, @Body() dto: PartyDto) {
    return this.catalog.createCustomer(user.organizationId, dto);
  }

  @Patch("customers/:id")
  @RequirePermissions("customer:update")
  updateCustomer(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: PartyDto) {
    return this.catalog.updateCustomer(user.organizationId, id, dto);
  }

  @Get("customers")
  @RequirePermissions("customer:read")
  listCustomers(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.catalog.listCustomers(user.organizationId, query);
  }

  @Post("vendors")
  @RequirePermissions("vendor:create")
  createVendor(@CurrentUser() user: AuthUser, @Body() dto: PartyDto) {
    return this.catalog.createVendor(user.organizationId, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      billingAddress: dto.billingAddress,
      shippingAddress: dto.shippingAddress,
      address: dto.address ?? dto.billingAddress,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      gstin: dto.gstin,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  @Patch("vendors/:id")
  @RequirePermissions("vendor:update")
  updateVendor(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: PartyDto) {
    return this.catalog.updateVendor(user.organizationId, id, dto);
  }

  @Get("vendors")
  @RequirePermissions("vendor:read")
  listVendors(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.catalog.listVendors(user.organizationId, query);
  }
}
