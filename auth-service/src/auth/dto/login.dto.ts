import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
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
    example: 'password123',
    description: 'User password',
  })
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  @ApiProperty({
    example: '2324dfdf',
    description: 'User deviceId',
  })
  @IsNotEmpty()
  @IsString()
  readonly deviceId: string;

  @ApiProperty({
    example: 1,
    description: 'User role',
  })
  @IsNotEmpty()
  @IsString()
  readonly role: number;
}
