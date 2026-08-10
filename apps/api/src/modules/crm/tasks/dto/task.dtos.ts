import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { CrmPriority, CrmTaskStatus } from "@prisma/client";

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

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

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

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
