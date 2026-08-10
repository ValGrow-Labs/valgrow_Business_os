import { IsEnum, IsNotEmpty } from "class-validator";
import { PeriodStatus } from "@prisma/client";

export class UpdatePeriodStatusDto {
  @IsEnum(PeriodStatus)
  @IsNotEmpty()
  status: PeriodStatus;
}
