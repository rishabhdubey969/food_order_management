
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
    console.log('inside delete cart')
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

  @Get('test-apply-coupon')
  async testApplyCoupon() {
    const cartId = '6835858ca5f96aed15e018c9';
    const couponCode = 'FOOD20';
    return await this.cartService.applyCouponService(cartId, couponCode);
  }
}

