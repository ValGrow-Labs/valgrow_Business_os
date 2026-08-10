import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;
}
