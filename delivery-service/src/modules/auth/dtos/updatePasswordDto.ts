import { IsNotEmpty, IsString, MinLength } from "class-validator";


export class UpdatePasswordDto{

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    newPassword: string;
}