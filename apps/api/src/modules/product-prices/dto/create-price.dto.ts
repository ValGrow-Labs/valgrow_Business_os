import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
} from "class-validator";
import { PriceTier } from "@prisma/client";

export class CreatePriceDto {
  @IsString()
  @IsOptional()
  variantId?: string;

  @IsEnum(PriceTier)
  @IsOptional()
  tier?: PriceTier;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;
}
