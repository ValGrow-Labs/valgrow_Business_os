import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
} from "class-validator";
import { TaxType, MasterDataStatus } from "@prisma/client";

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsEnum(TaxType)
  @IsOptional()
  type?: TaxType;

  @IsBoolean()
  @IsOptional()
  isInclusive?: boolean;

  @IsEnum(MasterDataStatus)
  @IsOptional()
  status?: MasterDataStatus;
}
