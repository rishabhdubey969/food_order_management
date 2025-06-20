import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CouponDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the coupon',
    example: '60c72b2f9b1e8c1a4f8f8f8f',
  })
  @IsNotEmpty({ message: 'couponId should not be empty' })
  @IsMongoId({ message: 'couponId must be a valid MongoDB ObjectId' })
  couponId: string;
}

export class RestaurantDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the restaurant',
    example: '64a51abab85e4eea0294410',
  })
  @IsNotEmpty({ message: 'restaurantId should not be empty' })
  @IsMongoId({ message: 'restaurantId must be a valid MongoDB ObjectId' })
  restaurantId: string;
}
