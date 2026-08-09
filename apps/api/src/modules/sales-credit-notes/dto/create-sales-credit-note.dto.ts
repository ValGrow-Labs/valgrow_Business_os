import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsEnum,
} from "class-validator";
import { SalesCreditNoteStatus } from "@prisma/client";

export class CreateSalesCreditNoteDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  salesInvoiceId?: string;

  @IsOptional()
  @IsString()
  salesReturnId?: string;

  @IsOptional()
  @IsDateString()
  creditDate?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSalesCreditNoteDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(SalesCreditNoteStatus)
  status?: SalesCreditNoteStatus;
}
