import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, ValidateNested, ArrayMinSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
    @IsString()
    @IsIn(['Point'])
    type: string;
  
    @IsArray()
    @ArrayMinSize(2)
    @IsNumber({}, { each: true }) // Ensures both values are numbers
    coordinates: number[]; // [longitude, latitude]
  }

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()  
  copons?: string[];
}
