import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { CustomerPaymentMethod } from "@prisma/client";

export class PosPaymentItemDto {
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  receivedAmount?: number;

  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

export class PosCheckoutDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  cartId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosPaymentItemDto)
  payments: PosPaymentItemDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  cartDiscountAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class PosRefundDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  items?: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    quantity: number;
  }>;
}
