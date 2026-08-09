import { IsOptional, IsString } from "class-validator";

export class SalesOrderActionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
