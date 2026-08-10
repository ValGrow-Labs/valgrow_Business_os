import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from "class-validator";
import { AccountType, AccountCategory, NormalBalance } from "@prisma/client";

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsEnum(AccountCategory)
  accountCategory: AccountCategory;

  @IsEnum(NormalBalance)
  normalBalance: NormalBalance;

  @IsString()
  @IsOptional()
  parentAccountId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  reconciliationEnabled?: boolean;
}
