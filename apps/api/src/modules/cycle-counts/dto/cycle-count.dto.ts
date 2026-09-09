import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateCycleCountDto {
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CountItemInputDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @IsNotEmpty()
  countedQty: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCountItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountItemInputDto)
  items: CountItemInputDto[];
}
