// src/auth/dto/verify-otp.dto.ts
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The ID of the user verifying the OTP',
    example: '683b551b2f9c4ff05b9c',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'userId must be a valid MongoDB ObjectId' })
  userId: string;

  @ApiProperty({
    description: 'The one-time password (OTP) sent to the user',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters long' })
  otp: string;

  @ApiProperty({
    description: 'The new password to set after OTP verification',
    example: 'newpassword123',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters long' })
  password: string;
}