import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { SerialStatus } from "@prisma/client";

export class CreateSerialDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsEnum(SerialStatus)
  @IsOptional()
  status?: SerialStatus;
}
