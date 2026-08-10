import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class AssignTagDto {
  @IsString()
  @IsNotEmpty()
  tagId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  opportunityId?: string;
}

export class UnassignTagDto {
  @IsString()
  @IsNotEmpty()
  tagId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  opportunityId?: string;
}
