import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { MasterDataStatus } from "@prisma/client";

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MasterDataStatus)
  @IsOptional()
  status?: MasterDataStatus;
}
