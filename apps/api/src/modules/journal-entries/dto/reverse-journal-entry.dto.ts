import { IsString, IsNotEmpty } from "class-validator";

export class ReverseJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
