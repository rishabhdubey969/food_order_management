import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Put,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateQuantityDto } from './dto/updateCart.dto';
import { ErrorInterceptor } from './common/error.interceptor';

@Controller('cart')
@UseInterceptors(ErrorInterceptor)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add/:userId')
  async addToCart(@Param('userId') userId: string, @Body() dto: AddToCartDto) {
    return await this.cartService.addToCart(userId, dto);
  }

  @Put('update/:userId')
  async updateQuantity(@Param('userId') userId: string, @Body() dto: UpdateQuantityDto) {
    return await this.cartService.updateQuantity(userId, dto);
  }

  @Delete('delete/:userId')
  async deleteCart(@Param('userId') userId: string, @Query('restaurantId') restaurantId: string) {
    return await this.cartService.deleteCartService(userId, restaurantId);
  }

 
  @Get('coupons/:restaurantId')
  async getAvailableCoupons(@Param('restaurantId') restaurantId: string) {
    return await this.cartService.getAvailableCoupons(restaurantId);
  }

 
  @Post('applyCoupon/:userId')
  async applyCoupon(@Param('userId') userId: string, @Query('restaurantId') restaurantId: string, @Body('couponCode') couponCode: string) {
    return await this.cartService.applyCoupon(userId, restaurantId, couponCode);
  }
}
