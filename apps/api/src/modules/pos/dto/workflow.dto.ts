import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { POSTransactionStatus } from "@prisma/client";

export class SendToBillingDto {
  @IsString()
  @IsOptional()
  customerId?: string | null;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SendToPaymentDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelPosTransactionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReturnToQueueDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class PosQueueFilterDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(POSTransactionStatus)
  @IsOptional()
  status?: POSTransactionStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 50;
}
