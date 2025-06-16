import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Logger,
  Req,
  UseGuards
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from './decorator/role.decorator';

import { GrpcAuthGuard } from './guards/auth.guard';
import { Role } from './common/role.enum';


@ApiTags('Cart')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('add/:restaurantId/:itemId')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiParam({ name: 'restaurantId', type: 'string' })
  @ApiParam({ name: 'itemId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  @ApiResponse({ status: 404, description: 'Item or restaurant not found' })
  @ApiResponse({ status: 409, description: 'Cart already exists for a different restaurant' })
  async addToCart(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Adding item ${itemId} to user ${userId}'s cart`);
    return this.cartService.addToCartService(userId, restaurantId, itemId);
  }

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('remove/:itemId')
  @ApiOperation({ summary: 'Remove/decrease item quantity from user cart' })
  @ApiParam({ name: 'itemId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Item removed or quantity decreased' })
  @ApiResponse({ status: 404, description: 'Cart or item not found in cart' })
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Removing item ${itemId} from user ${userId}'s cart`);
    return this.cartService.removeItemService(userId, itemId);
  }

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Delete('delete')
  @ApiOperation({ summary: 'Delete user’s active cart' })
  @ApiResponse({ status: 200, description: 'Cart deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found for user' })
  async deleteCart(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.warn(`Deleting cart for user ${userId}`);
    return this.cartService.deleteCartService(userId);
  }

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Get('get')
  @ApiOperation({ summary: 'Get user’s active cart' })
  @ApiResponse({ status: 200, description: 'User cart retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found for user' })
  async getCart(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.verbose(`Fetching cart for user ${userId}`);
    return this.cartService.getCartService(userId);
  }

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Get('coupons/:restaurantId')
  @ApiOperation({ summary: 'Get all available coupons for a restaurant' })
  @ApiParam({ name: 'restaurantId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coupons retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant or coupons not found' })
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`);
    return this.cartService.viewCouponsService(restaurantId);
  }

  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('applyCoupon/:couponId')
  @ApiOperation({ summary: 'Apply a coupon to user’s cart' })
  @ApiParam({ name: 'couponId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coupon applied successfully' })
  @ApiResponse({ status: 404, description: 'Cart or coupon not found' })
  @ApiResponse({ status: 400, description: 'Coupon not applicable or already applied' })
  async applyCoupon(
    @Param('couponId') couponId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Applying coupon ${couponId} to user ${userId}'s cart`);
    return this.cartService.applyCouponService(userId, couponId);
  }
}
