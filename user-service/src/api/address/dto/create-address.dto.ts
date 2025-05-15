import {
    IsNotEmpty,
    IsString,
    IsEmail,
    MinLength,
    IsInt,
    IsBoolean,
    IsArray,
    IsOptional,
    IsNumber,
} from 'class-validator';

export class CreateAddressDto {

    @IsNotEmpty()
    @IsString()
    readonly user_id: string;

    @IsNotEmpty()
    @IsString()
    label: string;

    @IsNotEmpty()
    @IsString()
    readonly house_no: string;

    @IsNotEmpty()
    @IsString()
    readonly address_location_1: string;

    @IsOptional()
    @IsString()
    readonly address_location_2: string;

    @IsNotEmpty()
    @IsInt()
    readonly postal_code: number;

    @IsNotEmpty()
    @IsString()
    readonly city: string;

    @IsNotEmpty()
    @IsString()
    readonly country: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

}

