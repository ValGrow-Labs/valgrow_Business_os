import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export class DeliveryNoteItemDto {
  @IsString()
  @IsNotEmpty()
  salesOrderItemId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class CreateDeliveryNoteDto {
  @IsString()
  @IsNotEmpty()
  salesOrderId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsOptional()
  @IsString()
  deliveredById?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryNoteItemDto)
  items: DeliveryNoteItemDto[];
}
