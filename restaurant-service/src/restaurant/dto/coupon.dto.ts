import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate } from 'class-validator';

export class CouponDto {
  @ApiProperty({ description: 'Coupon code', example: 'SUMMER25' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Discount percentage', example: 25 })
  @IsNumber()
  discountPercent: number;

  @ApiProperty({ description: 'Expiry date of the coupon', example: '2025-12-31T23:59:59.999Z' })
  @IsDate()
  expiryDate: Date;

  @ApiProperty({ description: 'Maximum discount value', example: 100 })
  @IsNumber()
  maxDiscount: number;

  @ApiProperty({ description: 'Minimum order amount required to apply the coupon', example: 500 })
  @IsNumber()
  minOrderAmount: number;
}
