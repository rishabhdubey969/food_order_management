import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';

import {
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { Roles } from './decorator/role.decorator';
import { RoleGuard } from './guards/role.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

// @UseGuards(JwtAuthGuard)
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles('user')
  // @UseGuards(RoleGuard)
  @Post('add/:userId/:restaurantId/:itemId')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.addToCartService(userId, itemId);
  }

  @Post('remove/:cartId/:itemId')
  async removeItem(@Param('cartId') cartId: string, @Param("itemId") itemId: string){
    return this.cartService.removeItemService(cartId, itemId);
  }

  @Roles('user')
  // @UseGuards(RoleGuard)
  @Delete('delete/:userId')
  @ApiOperation({ summary: 'Delete active cart' })
  async deleteCart(@Param('userId') userId: string) {
    return this.cartService.deleteCartService(userId);
  }

  @Roles('user')
  // @UseGuards(RoleGuard)
  @Get('get/:userId')
  @ApiOperation({ summary: 'Get user’s active cart' })
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCartService(userId);
  }

  @Roles('user')
  // @UseGuards(RoleGuard)
  @Get('coupons/:restaurantId')
  @ApiOperation({ summary: 'Get coupons for a restaurant' })
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    return this.cartService.viewCouponsService(restaurantId);
  }

  @Roles('user')
  // @UseGuards(RoleGuard)
  @Post('applyCoupon/:userId/:couponId')
  @ApiOperation({ summary: 'Apply coupon to user’s cart' })
  async applyCoupon(
    @Param('userId') userId: string,
    @Param('couponId') couponId: string,
  ) {
    return this.cartService.applyCouponService(userId, couponId);
  }
}
