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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  readonly user_id: string;

  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty({ description: 'Gender', example: 'male' })
  @IsNotEmpty()
  @IsString()
  readonly gender: string;

  @ApiProperty({ description: 'Date of birth', type: String, format: 'date-time', example: '1990-01-01T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly date_of_birth: Date;

  @ApiProperty({ description: 'Country', example: 'USA' })
  @IsNotEmpty()
  @IsString()
  readonly country: string;

  @ApiPropertyOptional({ description: 'Profile image URL', example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  readonly image: string;
}
