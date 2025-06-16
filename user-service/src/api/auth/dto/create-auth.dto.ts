import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 8, description: 'User password' })
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  @ApiProperty({ example: '9876543210', minLength: 10, description: 'User phone number' })
  @IsNotEmpty()
  @MinLength(10)
  readonly phone: string;

  @ApiProperty({ example: 1, description: 'User role as a number' })
  @IsNotEmpty()
  readonly role: number;

  @ApiProperty({ example: '123456', description: 'OTP for verification' })
  @IsNotEmpty()
  @IsString()
  readonly otp: string;

  @ApiProperty({ example: 'user', description: 'User name' })
  @IsNotEmpty()
  @IsString()
  readonly username: string;
}
