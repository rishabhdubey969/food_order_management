import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNotEmpty, IsMongoId, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @ApiProperty({
    description: 'The ID of the item',
    example: '12345abcde67890fghijk123',
  })
  @IsNotEmpty({ message: 'itemId should not be empty' })
  @IsMongoId({ message: 'itemId must be a valid MongoDB ObjectId' })
  itemId: string;

  @ApiProperty({
    description: 'The quantity of the item',
    example: 2,
  })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;
}

export class MultipleItemDto {
  @ApiProperty({
    description: 'The ID of the restaurant',
    example: '64a51abab85e4eea0294410',
  })
  @IsNotEmpty({ message: 'restaurantId should not be empty' })
  @IsMongoId({ message: 'restaurantId must be a valid MongoDB ObjectId' })
  restaurantId: string;

  @ApiProperty({
    description: 'Array of items to be processed',
    type: [ItemDto],
    example: [
      { itemId: '64b1234567890abcdef12345', quantity: 2 },
      { itemId: '64c1234567890abcdef12345', quantity: 1 },
    ],
  })
  @IsArray({ message: 'items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
