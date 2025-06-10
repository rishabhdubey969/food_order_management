import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email address of the admin',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the admin',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
