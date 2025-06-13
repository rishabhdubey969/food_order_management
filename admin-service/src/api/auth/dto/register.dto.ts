import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsIn(['admin', 'manager', 'user'])
  role: string;
}