import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddCartDto {
  @ApiProperty({
    description: 'The ID of the restaurant',
    example: '64a51abab85e4eea0294410',
  })
  @IsNotEmpty({ message: 'restaurantId should not be empty' })
  @IsMongoId({ message: 'restaurantId must be a valid MongoDB ObjectId' })
  restaurantId: string;

  @ApiProperty({
    description: 'The ID of the item to be added to the cart',
    example: '63d3dcb6728e2e8cc8dd6e4',
  })
  @IsNotEmpty({ message: 'itemId should not be empty' })
  @IsMongoId({ message: 'itemId must be a valid MongoDB ObjectId' })
  itemId: string;
}
