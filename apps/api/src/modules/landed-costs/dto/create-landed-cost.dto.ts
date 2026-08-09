import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from "class-validator";

export enum LandedCostType {
  FREIGHT = "FREIGHT",
  CUSTOMS = "CUSTOMS",
  INSURANCE = "INSURANCE",
  DUTY = "DUTY",
  OTHER = "OTHER",
}

export class CreateLandedCostDto {
  @IsString()
  @IsNotEmpty()
  goodsReceiptId: string;

  @IsEnum(LandedCostType)
  costType: LandedCostType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
