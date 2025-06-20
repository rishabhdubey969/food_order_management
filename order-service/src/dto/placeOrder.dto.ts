import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId, IsIn } from 'class-validator';
import { PaymentMethod } from 'src/order/constant/enum.constant';


export class PlaceOrderDto {
  @ApiProperty({
    description: 'Payment method for the order',
    example: 'cashOnDelivery/online',
    enum: Object.values(PaymentMethod),
  })
  @IsIn(["cashOnDelivery","online"], {
    message: `modeOfPayment must be one of: cashOnDelivery or online`
  })
  @IsNotEmpty()
  modeOfPayment: string;

  @ApiProperty({
    description: 'ID of the order to process',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;
}