import { IsOptional, IsString } from "class-validator";

export class SalesInvoiceActionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
