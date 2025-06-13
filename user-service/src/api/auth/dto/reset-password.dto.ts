import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ minLength: 8, description: 'New password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ minLength: 8, description: 'Confirm new password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  confirm_password: string;
}
