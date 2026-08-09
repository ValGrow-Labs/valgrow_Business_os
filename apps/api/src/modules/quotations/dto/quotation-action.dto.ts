import { IsOptional, IsString } from "class-validator";

export class QuotationActionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
