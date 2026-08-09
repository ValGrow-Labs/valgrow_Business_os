import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from "class-validator";

export class CreateSupplierInvoiceDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsOptional()
  purchaseOrderId?: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsDateString()
  invoiceDate: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @IsNumber()
  @Min(0)
  subtotalAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}

export class UpdateSupplierInvoiceDto {
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
