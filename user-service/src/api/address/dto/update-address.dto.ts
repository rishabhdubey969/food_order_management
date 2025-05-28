import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './create-address.dto';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  @IsOptional()
  @IsString()
  readonly user_id?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  readonly house_no?: string;

  @IsOptional()
  @IsString()
  readonly address_location_1?: string;

  @IsOptional()
  @IsString()
  readonly address_location_2?: string;

  @IsOptional()
  @IsInt()
  readonly postal_code?: number;

  @IsOptional()
  @IsString()
  readonly city?: string;

  @IsOptional()
  @IsString()
  readonly country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
