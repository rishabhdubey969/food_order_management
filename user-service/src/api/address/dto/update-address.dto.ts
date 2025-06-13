import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './create-address.dto';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  @ApiPropertyOptional({ description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  readonly user_id?: string;

  @ApiPropertyOptional({ description: 'Label for the address', example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'House number', example: '221B' })
  @IsOptional()
  @IsString()
  readonly house_no?: string;

  @ApiPropertyOptional({ description: 'First line of address location', example: 'Baker Street' })
  @IsOptional()
  @IsString()
  readonly address_location_1?: string;

  @ApiPropertyOptional({ description: 'Second line of address location', example: 'Marylebone' })
  @IsOptional()
  @IsString()
  readonly address_location_2?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: 123456 })
  @IsOptional()
  @IsInt()
  readonly postal_code?: number;

  @ApiPropertyOptional({ description: 'City name', example: 'London' })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiPropertyOptional({ description: 'Country name', example: 'United Kingdom' })
  @IsOptional()
  @IsString()
  readonly country?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 51.523774 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: -0.158538 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
