import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { AdjustmentReason } from "@prisma/client";

export class AdjustmentItemDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsNumber()
  @IsNotEmpty()
  currentQty: number;

  @IsNumber()
  @IsNotEmpty()
  adjustedQty: number;

  @IsNumber()
  @IsNotEmpty()
  newQty: number;

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;
}

export class CreateAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  adjustmentNumber: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsEnum(AdjustmentReason)
  @IsNotEmpty()
  reason: AdjustmentReason;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items: AdjustmentItemDto[];
}
