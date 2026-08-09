import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class OpenPosSessionDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  terminalId: string;

  @IsNumber()
  @Min(0)
  openingCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ClosePosSessionDto {
  @IsNumber()
  @Min(0)
  closingCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
