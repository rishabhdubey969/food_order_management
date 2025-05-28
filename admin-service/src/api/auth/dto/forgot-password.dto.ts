import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';



export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}