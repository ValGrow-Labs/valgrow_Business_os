import { IsString, IsOptional } from "class-validator";

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  expectedDeliveryDate?: string;
}

export class POActionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
