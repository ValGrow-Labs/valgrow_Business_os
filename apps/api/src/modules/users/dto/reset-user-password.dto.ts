import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export enum ResetPasswordAction {
  GENERATE_LINK = "generate-link",
  SET_TEMPORARY = "set-temporary",
}

export class ResetUserPasswordDto {
  @IsEnum(ResetPasswordAction, {
    message: "Action must be either 'generate-link' or 'set-temporary'",
  })
  @IsNotEmpty()
  action: ResetPasswordAction;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: "Temporary password must be at least 8 characters long",
  })
  temporaryPassword?: string;
}

