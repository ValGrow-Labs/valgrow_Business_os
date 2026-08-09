import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreatePosCartDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddPosCartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}

export class UpdatePosCartItemDto {
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;
}
