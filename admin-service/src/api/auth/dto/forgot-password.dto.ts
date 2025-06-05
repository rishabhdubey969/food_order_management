import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';



export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email address to send the password reset link to',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;
}