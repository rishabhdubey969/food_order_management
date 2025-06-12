import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class PrePlaceOrderDto {
  @ApiProperty({
    description: 'The ID of the cart to create an order from',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  cartId: string;
}