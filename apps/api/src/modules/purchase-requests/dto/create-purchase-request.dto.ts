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

export class CreatePurchaseRequestItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePurchaseRequestDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestItemDto)
  items: CreatePurchaseRequestItemDto[];
}
