// src/payments/dto/create-payment.dto.ts

import { IsString, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;
}
