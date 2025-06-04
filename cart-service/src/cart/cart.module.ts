import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { CouponSchema } from './schema/coupon.schema';
import { AddressSchema, Address } from './schema/address.schema';
import { RestaurantSchema } from './schema/restaurant.schema';



@Module({
  imports: [MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),    MongooseModule.forFeature([
    { name: 'Coupons', schema: CouponSchema },
    
  ]), 
  MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }]),
  MongooseModule.forFeature([{ name: 'Restaurant', schema: RestaurantSchema }])
],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
