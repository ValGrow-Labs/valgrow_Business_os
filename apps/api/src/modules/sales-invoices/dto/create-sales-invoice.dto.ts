import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export class SalesInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}

export class CreateSalesInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  salesOrderId?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  exchangeRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceItemDto)
  items: SalesInvoiceItemDto[];
}
