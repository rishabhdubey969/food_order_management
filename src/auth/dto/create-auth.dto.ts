import {
    IsNotEmpty,
    IsString,
    IsEmail,
    MinLength,
    IsInt,
    IsBoolean,
    IsArray,
  } from 'class-validator';

  export class CreateAuthDto {

    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsEmail()
    @IsString()
    readonly email: string;

    @IsNotEmpty()
    @MinLength(8)
    readonly password: string;

    @IsNotEmpty()
    @IsBoolean()
    readonly is_active: boolean;

  }
  
