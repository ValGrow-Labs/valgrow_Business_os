import { IsOptional, IsEnum, IsString } from "class-validator";
import { TransferStatus } from "@prisma/client";

export class UpdateTransferDto {
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
