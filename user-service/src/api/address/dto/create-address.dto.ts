import { IsNotEmpty, IsString, IsInt, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'user_id', description: 'user_id of the user' })
  @IsNotEmpty()
  @IsString()
  readonly user_id: string;

  @ApiProperty({ example: 'office || home || other', description: 'user address label' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: 'house_no', description: 'user house number' })
  @IsNotEmpty()
  @IsString()
  readonly house_no: string;

  @ApiProperty({ example: 'user address information 1', description: 'user address land mark ' })
  @IsNotEmpty()
  @IsString()
  readonly address_location_1: string;

  @ApiPropertyOptional({ example: 'user address information 2', description: 'user address land mark and road and near by' })
  @IsOptional()
  @IsString()
  readonly address_location_2: string;

  @ApiProperty({ example: 498549, description: 'user pin_code information' })
  @IsNotEmpty()
  @IsInt()
  readonly postal_code: number;

  @ApiProperty({ example: 'city', description: 'user city address' })
  @IsNotEmpty()
  @IsString()
  readonly city: string;

  @ApiProperty({ example: 'country', description: 'user country address' })
  @IsNotEmpty()
  @IsString()
  readonly country: string;

  @ApiProperty({ example: 28.6139, description: 'latitude of the address' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.209, description: 'longitude of the address' })
  @IsNumber()
  longitude: number;
  
}
