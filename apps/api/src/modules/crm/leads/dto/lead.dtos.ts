import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  IsEnum,
} from "class-validator";
import { LeadStatus } from "@prisma/client";

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  pipelineId?: string;

  @IsString()
  @IsOptional()
  stageId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;
}

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  pipelineId?: string;

  @IsString()
  @IsOptional()
  stageId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;
}

export class ConvertLeadDto {
  @IsString()
  @IsOptional()
  existingCustomerId?: string;

  @IsString()
  @IsOptional()
  customerCode?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  taxIdNumber?: string;

  @IsOptional()
  createOpportunity?: boolean;

  @IsString()
  @IsOptional()
  opportunityName?: string;

  @IsString()
  @IsOptional()
  pipelineId?: string;

  @IsString()
  @IsOptional()
  stageId?: string;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;
}
