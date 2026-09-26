import { IsNumber, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateReorderSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;
}
