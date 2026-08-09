import { IsString, IsOptional, IsDateString, IsEnum } from "class-validator";

export enum PRStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export class UpdatePurchaseRequestDto {
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
}

export class PRActionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
