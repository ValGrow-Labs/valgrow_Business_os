import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";
import { StockMovementType } from "@prisma/client";

export class CreateMovementDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

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

  @IsString()
  @IsOptional()
  serialNumberId?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsEnum(StockMovementType)
  @IsNotEmpty()
  movementType: StockMovementType;

  @IsNumber()
  @IsNotEmpty()
  quantity: number; // Positive (+) for inbound, Negative (-) for outbound

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
