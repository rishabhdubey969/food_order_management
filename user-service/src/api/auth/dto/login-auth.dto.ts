import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'User password (min 8 characters)',
  })
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  @ApiProperty({
    example: 'device-12345',
    description: 'Unique device identifier',
  })
  @IsNotEmpty()
  @IsString()
  readonly deviceId: string;
}
