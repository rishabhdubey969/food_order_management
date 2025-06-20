import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus } from 'src/order/constant/enum.constant';


export class OrderDto {
  @ApiProperty({ description: 'Order ID' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ 
    description: 'Order status',
    enum: Object.values(OrderStatus)
  })
  status: string;

  @ApiProperty({ 
    description: 'Payment status',
    enum: Object.values(PaymentStatus)
  })
  paymentStatus: string;

  @ApiProperty({ 
    description: 'Payment method',
    enum: Object.values(PaymentMethod)
  })
  paymentMethod: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Items in the order', type: [Object] })
  items: any[];

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}