import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsInt,
  IsBoolean,
  IsArray,
  IsDate,
  IsOptional,
} from 'class-validator';

export class CreateProfileDto {

  @IsNotEmpty()
  @IsString()
  readonly user_id: string;

  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  readonly gender: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly date_of_birth: Date;

  @IsNotEmpty()
  @IsString()
  readonly country: string;

  @IsOptional()
  @IsString()
  readonly image: string;

}

