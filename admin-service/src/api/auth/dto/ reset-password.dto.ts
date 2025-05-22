import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';



export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}