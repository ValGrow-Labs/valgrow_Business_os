import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from "class-validator";

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  referenceType: string; // POS_CART, SALES_ORDER, ECOMMERCE

  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}
