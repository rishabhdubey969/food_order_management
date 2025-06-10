import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';



export class ResetPasswordDto {
  @ApiProperty({
    description: 'The reset token sent to the email',
    example: 'abc123token',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The new password to set',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}