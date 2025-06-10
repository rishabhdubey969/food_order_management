import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, ValidateNested, ArrayMinSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ description: 'Type of the geojson object', example: 'Point', enum: ['Point'] })
  @IsString()
  @IsIn(['Point'])
  type: string;

  @ApiProperty({ 
    description: 'Coordinates as [longitude, latitude]', 
    type: [Number], 
    example: [40.7128, -74.0060], 
    minItems: 2,
    maxItems: 2
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class CreateRestaurantDto {
  @ApiProperty({ description: 'Name of the restaurant', example: 'The Great Eatery' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the restaurant', example: 'A cozy place with delicious food' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Physical address of the restaurant', example: '123 Food St, Flavor Town' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Contact phone number', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'GeoJSON location object', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Tags associated with the restaurant', type: [String], example: ['italian', 'pizza'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
