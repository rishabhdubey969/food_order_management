import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger"; // Import ApiProperty

export class ForgotPasswordDto{

    @ApiProperty({
        description: 'The email address associated with the account',
        example: 'user@example.com',
        format: 'email'
    })
    @IsNotEmpty({ message: 'Email cannot be empty' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;
}