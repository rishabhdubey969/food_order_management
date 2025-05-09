import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export default class managerSignupDto {
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

  @IsOptional()
  @IsString()
  restaurantId?: string; // optional if assigning later
}
