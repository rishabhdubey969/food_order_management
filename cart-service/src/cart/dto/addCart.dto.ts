import { ApiProperty } from '@nestjs/swagger';

export class AddCartDto {
  @ApiProperty({
    description: 'The ID of the restaurant',
    example: '64a51abab85e4eea0294410',
  })
  restaurantId: string;

  @ApiProperty({
    description: 'The ID of the item to be added to the cart',
    example: '63d3dcb6728e2e8cc8dd6e4',
  })
  itemId: string;
}