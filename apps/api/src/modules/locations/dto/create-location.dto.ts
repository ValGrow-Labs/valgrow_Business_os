import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { MasterDataStatus } from "@prisma/client";

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  aisle?: string;

  @IsString()
  @IsOptional()
  rack?: string;

  @IsString()
  @IsOptional()
  shelf?: string;

  @IsString()
  @IsOptional()
  bin?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsEnum(MasterDataStatus)
  @IsOptional()
  status?: MasterDataStatus;
}
