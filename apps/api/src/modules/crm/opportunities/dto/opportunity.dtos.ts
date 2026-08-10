import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from "class-validator";
import { OpportunityStatus } from "@prisma/client";

export class CreateOpportunityDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  pipelineId: string;

  @IsString()
  @IsNotEmpty()
  stageId: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;
}

export class UpdateOpportunityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

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

  @IsNumber()
  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;

  @IsString()
  @IsOptional()
  closeReason?: string;
}

export class UpdateOpportunityStageDto {
  @IsString()
  @IsNotEmpty()
  stageId: string;

  @IsNumber()
  @IsOptional()
  probability?: number;

  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;

  @IsString()
  @IsOptional()
  closeReason?: string;
}
