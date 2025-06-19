import { IsEmail, IsNotEmpty } from "class-validator";


export class RegisterEmailDto{

    @IsNotEmpty()
    @IsEmail()
    email: string;
    
}