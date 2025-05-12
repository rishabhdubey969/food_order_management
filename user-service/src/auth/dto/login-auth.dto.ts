import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
export class LoginAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;
}
