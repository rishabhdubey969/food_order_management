import { IsNotEmpty, IsString, MinLength } from "class-validator";


export class UpdatePasswordDto{

    @IsNotEmpty()
    @MinLength(6)
    otp: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    newPassword: string;
}