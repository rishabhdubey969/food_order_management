import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export default class ManagerSignupDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsEmail()
    email: string;
  
    @IsPhoneNumber()
    phone: string;
  
    @IsString()
    password: string;
  
    @IsString()
    restaurantId: string;
}