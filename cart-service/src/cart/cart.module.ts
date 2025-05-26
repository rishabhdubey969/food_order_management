import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { RestaurantCouponsSchema } from './schema/coupon.schema';
import { AddressSchema, Address } from './schema/address.schema';



@Module({
  imports: [MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),    MongooseModule.forFeature([
    { name: 'Coupons', schema: RestaurantCouponsSchema },
  ]), 
  MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
