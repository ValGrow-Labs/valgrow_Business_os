import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ProductStatus } from "@prisma/client";

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsOptional()
  attributes?: any;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
