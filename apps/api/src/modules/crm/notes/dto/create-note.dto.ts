import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

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
