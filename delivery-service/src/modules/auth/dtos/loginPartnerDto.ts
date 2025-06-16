import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger"; // Import ApiProperty

export class LoginPartnerDto {

    @ApiProperty({
        description: 'The email address of the partner',
        example: 'john.doe@example.com',
        format: 'email',
    })
    @IsString({ message: 'Email must be a string' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'The partner\'s password (minimum 8 characters)',
        minLength: 8,
        example: 'StrongPass@123',
    })
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;
}