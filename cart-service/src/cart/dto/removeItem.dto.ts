import { ApiProperty } from '@nestjs/swagger';

export class RemoveItemDto {
  @ApiProperty({
    description: 'The ID of the item to be removed from the cart',
    example: '63d3dcb6728e2e8cc8dd6e4',
  })
  itemId: string;
}
