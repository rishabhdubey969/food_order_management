import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ description: 'Name of the menu item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the menu item' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the menu item' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Image URL of the menu item' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Tags related to the menu item', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
