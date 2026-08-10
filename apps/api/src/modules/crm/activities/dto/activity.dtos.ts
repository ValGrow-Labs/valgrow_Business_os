import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";
import { CrmActivityType, CrmPriority, CrmTaskStatus } from "@prisma/client";

export class CreateActivityDto {
  @IsEnum(CrmActivityType)
  @IsOptional()
  type?: CrmActivityType;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  activityDate?: string;

  @IsEnum(CrmPriority)
  @IsOptional()
  priority?: CrmPriority;

  @IsEnum(CrmTaskStatus)
  @IsOptional()
  status?: CrmTaskStatus;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  opportunityId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateActivityDto {
  @IsEnum(CrmActivityType)
  @IsOptional()
  type?: CrmActivityType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  activityDate?: string;

  @IsEnum(CrmPriority)
  @IsOptional()
  priority?: CrmPriority;

  @IsEnum(CrmTaskStatus)
  @IsOptional()
  status?: CrmTaskStatus;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}
