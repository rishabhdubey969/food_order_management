import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import { IsNotEmpty, IsString, MinLength, IsDate, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {

    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsString()
    readonly email: string;

    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(10)
    readonly phone: string;

    @IsNotEmpty()
    @IsString()
    readonly gender: string;
    
     @IsNotEmpty()
     @IsDate()
     @Type(() => Date) 
    readonly date_of_birth: Date;

    // @IsNotEmpty()
    // @IsString()
    // readonly material_status: string;

    @IsNotEmpty()
    @IsString()
    readonly country: string;

    @IsOptional()
    @IsString()
    image?: string;

}
