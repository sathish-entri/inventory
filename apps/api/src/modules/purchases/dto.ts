import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common/pagination";

export class PurchaseOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class PurchaseReceiveQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;
}

export class BillQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;
}

export class PurchaseReturnQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;
}

