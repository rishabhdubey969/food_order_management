import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger"; // Import ApiProperty

export class UpdatePasswordDto {

    @ApiProperty({
        description: 'The new password for the user (minimum 8 characters)',
        minLength: 8,
        example: 'myNewStrongPass789',
    })
    @IsNotEmpty({ message: 'New password cannot be empty' })
    @IsString({ message: 'New password must be a string' })
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    newPassword: string;
}