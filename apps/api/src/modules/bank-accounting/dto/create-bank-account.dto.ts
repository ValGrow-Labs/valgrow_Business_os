import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { BankAccountType } from "@prisma/client";

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  ifscCode?: string;

  @IsString()
  @IsOptional()
  swiftCode?: string;

  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @IsString()
  @IsNotEmpty()
  accountId: string;
}
