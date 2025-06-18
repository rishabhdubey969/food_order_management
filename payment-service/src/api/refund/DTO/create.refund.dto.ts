import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ example: '29048384eu', description: 'Order Id' })
  @IsString()
  orderId: string;
}
