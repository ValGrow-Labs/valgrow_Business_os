import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { PipelineType } from "@prisma/client";

export class CreatePipelineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PipelineType)
  @IsOptional()
  type?: PipelineType;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdatePipelineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  position?: number;

  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateStageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  position?: number;

  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  color?: string;
}
