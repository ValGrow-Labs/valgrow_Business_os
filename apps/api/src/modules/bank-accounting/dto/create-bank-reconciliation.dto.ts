import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional } from "class-validator";

export class CreateBankReconciliationDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @IsDateString()
  statementDate: string;

  @IsNumber()
  endingBalance: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
