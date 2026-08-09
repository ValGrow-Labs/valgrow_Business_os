import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
} from "class-validator";

export enum PaymentMethodEnum {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHEQUE = "CHEQUE",
  CREDIT_CARD = "CREDIT_CARD",
  UPI = "UPI",
}

export class CreateSupplierPaymentDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsString()
  @IsOptional()
  supplierInvoiceId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  paymentMethod?: PaymentMethodEnum;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
