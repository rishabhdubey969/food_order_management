import { IsEmail, IsNotEmpty, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export default class ManagerLoginDto {
  @ApiProperty({ example: 'manager@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'restaurant123' })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  rememberMe: boolean;
}
