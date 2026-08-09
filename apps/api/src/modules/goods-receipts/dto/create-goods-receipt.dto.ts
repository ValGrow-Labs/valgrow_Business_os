import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateGoodsReceiptItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderItemId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsDateString()
  @IsOptional()
  manufactureDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsNumber()
  @Min(0.0001)
  receivedQty: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rejectedQty?: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsArray()
  @IsOptional()
  serialNumbers?: string[];
}

export class CreateGoodsReceiptDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}
