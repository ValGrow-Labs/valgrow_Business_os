import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { SalesReturnReason } from "@prisma/client";

export class SalesReturnItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsNumber()
  @Min(0.0001)
  originalQty: number;

  @IsNumber()
  @Min(0.0001)
  returnedQty: number;

  @IsOptional()
  @IsEnum(SalesReturnReason)
  reason?: SalesReturnReason;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsNumber()
  @Min(0)
  refundAmount: number;
}

export class CreateSalesReturnDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  salesOrderId?: string;

  @IsOptional()
  @IsString()
  salesInvoiceId?: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesReturnItemDto)
  items: SalesReturnItemDto[];
}
