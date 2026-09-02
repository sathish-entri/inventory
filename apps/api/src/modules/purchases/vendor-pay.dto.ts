import { IsNumber, IsString } from "class-validator";

export class VendorPayDto {
  @IsString()
  vendorId!: string;
  @IsNumber()
  amount!: number;
  @IsString()
  method!: string;
}
