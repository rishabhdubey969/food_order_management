import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderHandoverDto {
  @ApiProperty({ example: '684ad089fd5ce30786f9684b' })
  @IsMongoId()
  orderId: string;
}
