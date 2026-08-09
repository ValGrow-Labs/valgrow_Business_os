import { IsOptional, IsString } from "class-validator";

export class DeliveryNoteActionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
