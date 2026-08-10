import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateMappingDto {
  @IsString()
  @IsNotEmpty()
  mappingKey: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsOptional()
  description?: string;
}
