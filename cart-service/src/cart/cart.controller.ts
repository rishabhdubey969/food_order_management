// import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
// import { CartService } from "./cart.service";
// import { AddToCartDto } from "./dto/addCart.dto";
// import { UpdateCartDto } from "./dto/updateCart.dto";
// import { ApiTags, ApiOperation, ApiParam, ApiBody } from "@nestjs/swagger";

// @ApiTags('Cart')
// @Controller('cart')
// export class CartController {
//   constructor(private readonly cartService: CartService ) {}

//   @Post('add/:userId/:restaurantId')
//   @ApiOperation({ summary: 'Add item to cart' })
//   @ApiParam({ name: 'userId', type: String })
//   @ApiParam({ name: 'restaurantId', type: String })
//   @ApiBody({ type: AddToCartDto })
//   async addToCart(
//     @Param('userId') userId: string,
//     @Param('restaurantId') restaurantId: string,
//     @Body() addToCartDTO: AddToCartDto,
//   ) {
//     return this.cartService.addToCartService(userId, restaurantId, addToCartDTO);
//   }

//   @Put('update/:userId/:restaurantId')
//   @ApiOperation({ summary: 'Update cart item' })
//   @ApiParam({ name: 'userId', type: String })
//   @ApiParam({ name: 'restaurantId', type: String })
//   @ApiBody({ type: UpdateCartDto })
//   async updateCart(
//     @Param('userId') userId: string,
//     @Param('restaurantId') restaurantId: string,
//     @Body() cart: UpdateCartDto,
//   ) {
//     return this.cartService.updateCartService(userId, restaurantId, cart);
//   }

//   @Delete('delete/:cartId')
//   @ApiOperation({ summary: 'Delete cart after order placement' })
//   @ApiParam({ name: 'cartId', type: String })
//   async deleteCart(@Param('cartId') cartId: string) {
//     return this.cartService.deleteCartService(cartId);
//   }

//   @Delete('remove/:userId/:restaurantId')
//   @ApiOperation({ summary: 'User removes cart manually' })
//   @ApiParam({ name: 'userId', type: String })
//   @ApiParam({ name: 'restaurantId', type: String })
//   async removeCart(@Param('userId') userId: string, @Param('restaurantId') restaurantId: string) {
//     return this.cartService.removeCartService(userId, restaurantId);
//   }

//   @Get('getAllCarts/:userId')
//   @ApiOperation({ summary: 'Get all carts of a user' })
//   @ApiParam({ name: 'userId', type: String })
//   async viewAllCarts(@Param('userId') userId: string ) {
//     return this.cartService.viewAllCartsService(userId);
//   }

//   @Get('getCart/:userId/:restaurantId')
//   @ApiOperation({ summary: 'Get specific cart for a restaurant' })
//   @ApiParam({ name: 'userId', type: String })
//   @ApiParam({ name: 'restaurantId', type: String })
//   async specificCart(@Param('userId') userId: string, @Param('restaurantId') restaurantId: string) {
//     return this.cartService.specificCartService(userId, restaurantId);
//   }

//   @Get('viewCoupons/:restaurantId')
//   @ApiOperation({ summary: 'View available coupons for a restaurant' })
//   @ApiParam({ name: 'restaurantId', type: String })
//   async viewCoupons(@Param('restaurantId') restaurantId: string) {
//     return this.cartService.viewCouponsService(restaurantId);
//   }

//   @Post('applyCoupon/:couponId')
//   @ApiOperation({ summary: 'Apply a coupon to the cart' })
//   @ApiParam({ name: 'couponId', type: String })
//   async applyCoupon(@Param('couponId') couponId: string) {
//     return this.cartService.applyCouponService(couponId);
//   }
// }






import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateCartDto } from './dto/updateCart.dto';
import {
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add/:userId/:restaurantId')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addToCartService(userId, restaurantId, dto);
  }

  @Put('update/:userId/:restaurantId')
  @ApiOperation({ summary: 'Update cart item' })
  async updateCart(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartService.updateCartService(userId, restaurantId, dto);
  }

  @Delete('delete/:cartId')
  @ApiOperation({ summary: 'Delete cart after order placement' })
  async deleteCart(@Param('cartId') cartId: string) {
    return this.cartService.deleteCartService(cartId);
  }

  @Delete('remove/:userId/:restaurantId')
  @ApiOperation({ summary: 'User removes cart manually' })
  async removeCart(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.cartService.removeCartService(userId, restaurantId);
  }

  @Get('getAllCarts/:userId')
  @ApiOperation({ summary: 'Get all carts of a user' })
  async viewAllCarts(@Param('userId') userId: string) {
    return this.cartService.viewAllCartsService(userId);
  }

  @Get('getCart/:userId/:restaurantId')
  @ApiOperation({ summary: 'Get specific cart for a restaurant' })
  async specificCart(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.cartService.specificCartService(userId, restaurantId);
  }

  @Get('viewCoupons/:restaurantId')
  @ApiOperation({ summary: 'View coupons for a restaurant' })
  async viewCoupons(@Param('restaurantId') restaurantId: string) {
    return this.cartService.viewCouponsService(restaurantId);
  }

  @Post('applyCoupon/:cartId/:couponCode')
  @ApiOperation({ summary: 'Apply coupon to cart' })
  async applyCoupon(
    @Param('cartId') cartId: string,
    @Param('couponCode') couponCode: string,
  ) {
    return this.cartService.applyCouponService(cartId, couponCode);
  }

  @Post('checkoutAll/:userId')
  @ApiOperation({ summary: 'Checkout all carts for a user' })
  async checkoutAll(@Param('userId') userId: string) {
    return this.cartService.checkoutAllCarts(userId);
  }
}

