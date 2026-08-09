import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEnum,
} from "class-validator";
import { MasterDataStatus } from "@prisma/client";

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsBoolean()
  @IsOptional()
  allowDecimals?: boolean;

  @IsEnum(MasterDataStatus)
  @IsOptional()
  status?: MasterDataStatus;
}
