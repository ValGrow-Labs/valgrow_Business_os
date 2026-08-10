import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCostCenterDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
