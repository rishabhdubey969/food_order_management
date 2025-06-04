import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
export class SendOtpDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;
}