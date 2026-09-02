import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ProductType } from "@prisma/client";

export class NameDto {
  @IsString()
  name!: string;
}

export class UnitDto {
  @IsString()
  name!: string;
  @IsString()
  abbreviation!: string;
}

export class CreateWarehouseDto {
  @IsString()
  name!: string;
  @IsString()
  code!: string;
  @IsOptional()
  @IsString()
  address?: string;
  @IsOptional()
  @IsString()
  city?: string;
  @IsOptional()
  @IsString()
  state?: string;
  @IsOptional()
  @IsString()
  country?: string;
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreateProductDto {
  @IsString()
  name!: string;
  @IsString()
  sku!: string;
  @IsOptional()
  @IsString()
  barcode?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;
  @IsOptional()
  @IsString()
  categoryId?: string;
  @IsOptional()
  @IsString()
  brandId?: string;
  @IsOptional()
  @IsString()
  unitId?: string;
  @IsOptional()
  @IsNumber()
  sellingPrice?: number;
  @IsOptional()
  @IsNumber()
  costPrice?: number;
  @IsOptional()
  @IsNumber()
  taxRate?: number;
  @IsOptional()
  @IsNumber()
  reorderLevel?: number;
  @IsOptional()
  @IsString()
  preferredVendorId?: string;
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
  @IsOptional()
  @IsArray()
  components?: { childProductId: string; quantity: number }[];
}

export class OpeningStockDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;
  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;
  @IsNumber()
  quantityDelta!: number;
  @IsString()
  reason!: string;
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;
  @IsString()
  @IsNotEmpty()
  toWarehouseId!: string;
  @IsArray()
  @ArrayNotEmpty()
  lines!: { productId: string; quantity: number }[];
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PartyDto {
  @IsString()
  name!: string;
  @IsOptional()
  @IsString()
  email?: string;
  @IsOptional()
  @IsString()
  phone?: string;
  @IsOptional()
  @IsString()
  billingAddress?: string;
  @IsOptional()
  @IsString()
  shippingAddress?: string;
  @IsOptional()
  @IsString()
  address?: string;
  @IsOptional()
  @IsString()
  city?: string;
  @IsOptional()
  @IsString()
  state?: string;
  @IsOptional()
  @IsString()
  pincode?: string;
  @IsOptional()
  @IsString()
  gstin?: string;
  @IsOptional()
  @IsNumber()
  latitude?: number;
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class LineDto {
  @IsString()
  productId!: string;
  @IsNumber()
  quantity!: number;
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
  @IsOptional()
  @IsNumber()
  unitCost?: number;
  @IsOptional()
  @IsNumber()
  taxRate?: number;
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEstimateDto {
  @IsString()
  customerId!: string;
  @IsOptional()
  @IsString()
  warehouseId?: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  lines!: LineDto[];
  @IsOptional()
  @IsNumber()
  discount?: number;
  @IsOptional()
  @IsNumber()
  shipping?: number;
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSalesOrderDto {
  @IsString()
  customerId!: string;
  @IsOptional()
  @IsString()
  warehouseId?: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  lines!: LineDto[];
  @IsOptional()
  @IsNumber()
  discount?: number;
  @IsOptional()
  @IsNumber()
  shipping?: number;
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  vendorId!: string;
  @IsString()
  warehouseId!: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  lines!: LineDto[];
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveLineDto {
  @IsString()
  productId!: string;
  @IsNumber()
  quantity!: number;
  @IsOptional()
  @IsString()
  batchNumber?: string;
  @IsOptional()
  @IsArray()
  serialNumbers?: string[];
}

export class ReceiveDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReceiveLineDto)
  lines!: ReceiveLineDto[];
}

export class PackageLineDto {
  @IsString()
  productId!: string;
  @IsNumber()
  quantity!: number;
}

export class PackageDto {
  @IsString()
  salesOrderId!: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PackageLineDto)
  lines!: PackageLineDto[];
}

export class AllocationDto {
  @IsString()
  invoiceId!: string;
  @IsNumber()
  amount!: number;
}

export class PaymentDto {
  @IsString()
  customerId!: string;
  @IsNumber()
  amount!: number;
  @IsString()
  method!: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations!: AllocationDto[];
}

export class InviteUserDto {
  @IsString()
  email!: string;
  @IsString()
  firstName!: string;
  @IsString()
  lastName!: string;
  @IsString()
  password!: string;
  @IsString()
  roleName!: string;
}

export class CreateBatchDto {
  @IsString()
  productId!: string;
  @IsString()
  warehouseId!: string;
  @IsString()
  batchNumber!: string;
  @IsNumber()
  quantity!: number;
  @IsOptional()
  manufacturedAt?: string;
  @IsOptional()
  expiresAt?: string;
}

export class CreateSerialDto {
  @IsString()
  productId!: string;
  @IsString()
  serial!: string;
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class ReturnLineDto {
  @IsString()
  productId!: string;
  @IsNumber()
  quantity!: number;
}

export class ReturnDto {
  @IsString()
  warehouseId!: string;
  @IsOptional()
  @IsString()
  customerId?: string;
  @IsOptional()
  @IsString()
  vendorId?: string;
  @IsOptional()
  @IsString()
  salesOrderId?: string;
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  lines!: ReturnLineDto[];
  @IsOptional()
  @IsString()
  reason?: string;
}
