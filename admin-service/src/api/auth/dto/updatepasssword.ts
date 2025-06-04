import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';




export class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}