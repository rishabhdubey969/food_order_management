import { IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger"; // Import ApiProperty

export class ChangePasswordDto {

    @ApiProperty({
        description: 'The user\'s current password',
        minLength: 8,
        example: 'oldSecurePassword123'
    })
    @IsNotEmpty()
    @MinLength(8, { message: 'Old password must be at least 8 characters long' })
    oldPassword: string;

    @ApiProperty({
        description: 'The user\'s new password',
        minLength: 8,
        example: 'newSecurePassword456'
    })
    @IsNotEmpty()
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    newPassword: string;
}