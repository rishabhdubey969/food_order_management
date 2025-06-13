import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Prop } from '@nestjs/mongoose';

export default class ManagerSignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'restaurant123' })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  @Length(9, 18) 
  accountNumber: string;

  @ApiProperty({ example: 'ABC01234567' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  ifscCode: string;

  @ApiProperty({ example: 'HDFC Bank' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

}



