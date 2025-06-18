import { ApiProperty } from '@nestjs/swagger';
import {  IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: '29048384eu', description: 'Order Id' })
  @IsString()
  orderId: string;
}
