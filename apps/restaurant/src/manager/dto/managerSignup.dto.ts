import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber, Length } from 'class-validator';

export default class ManagerSignupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  @Length(9, 18) 
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;
}
