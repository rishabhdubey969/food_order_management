import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsDate,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiProperty({ example: 'john_doe', description: 'Unique username of the user' })
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address of the user' })
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty({ example: '9876543210', minLength: 10, maxLength: 10, description: '10-digit phone number of the user' })
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10)
  readonly phone: string;

  @ApiProperty({ example: 'male', description: 'Gender of the user' })
  @IsNotEmpty()
  @IsString()
  readonly gender: string;

  @ApiProperty({ example: '1990-01-01', type: String, format: 'date', description: 'Date of birth of the user' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly date_of_birth: Date;

  // @ApiProperty({ example: 'single', description: 'Marital status of the user' })
  // @IsNotEmpty()
  // @IsString()
  // readonly material_status: string;

  @ApiProperty({ example: 'India', description: 'Country of the user' })
  @IsNotEmpty()
  @IsString()
  readonly country: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Profile image URL of the user' })
  @IsOptional()
  @IsString()
  image?: string;
}
