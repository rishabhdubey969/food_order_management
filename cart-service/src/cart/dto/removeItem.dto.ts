import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class RemoveItemDto {
  @ApiProperty({
    description: 'The ID of the item to be removed from the cart',
    example: '63d3dcb6728e2e8cc8dd6e4',
  })
  @IsNotEmpty({ message: 'itemId should not be empty' })
  @IsMongoId({ message: 'itemId must be a valid MongoDB ObjectId' })
  itemId: string;
}
