import { ApiProperty } from '@nestjs/swagger';

export class MultipleItemDto {
  @ApiProperty({
    description: 'The ID of the restaurant',
    example: '67890',
  })
  restaurantId: string;

  @ApiProperty({
    description: 'Array of items to be processed',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'The ID of the item',
          example: '12345',
        },
        quantity: {
          type: 'number',
          description: 'The quantity of the item',
          example: 2,
        },
      },
    },
    example: [
      { itemId: '12345', quantity: 2 },
      { itemId: '67890', quantity: 1 },
    ],
  })
  items: {
    itemId: string;
    quantity: number;
  }[];
}