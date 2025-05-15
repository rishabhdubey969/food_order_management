import { int } from 'aws-sdk/clients/datapipeline';
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
  @IsEmail()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  @IsNotEmpty()
  @MinLength(10)
  readonly phone: string;

  @IsNotEmpty()
  readonly role: number;

}

