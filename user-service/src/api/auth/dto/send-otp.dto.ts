import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Email address to send the OTP to',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;
}