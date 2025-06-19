import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Body,
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
import { WinstonLogger } from '../logger/winston-logger.service';
import { AddCartDto } from './dto/addCart.dto';
import { RemoveItemDto } from './dto/removeItem.dto';



@ApiTags('Cart')
@Controller('cart')
export class CartController {
  private readonly context = CartController.name;

  constructor(
    private readonly cartService: CartService,
    private readonly logger: WinstonLogger, 
  ) {}


  // increase item quantity 
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('add')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    schema: {
      example: {
        _id: '6851b7b5786ecbff4c06e854 //THIS IS CARTId',
        userId: '684d51abab85e4eea0294410',
        couponCode: null,
        couponId: null,
        deliveryCharges: 2501,
        discount: 0,
        distanceInKm: 500,
        itemTotal: 29.97,
        items: [
          {
            itemId: '683d3dcb6728e2e8cc8dd6e4',
            name: 'Margherita Pizza',
            quantity: 3,
            price: 9.99,
            tax: 1.4985,
          },
        ],
        platformFee: 9,
        restaurantId: '683d7adf339b913562146f00',
        subtotal: 29.97,
        tax: 1.4985,
        total: 2541,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Item or restaurant not found' })
  @ApiResponse({ status: 409, description: 'Cart already exists for a different restaurant' })
  async addToCart(
    @Body() addToCartDTO: AddCartDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Adding item ${addToCartDTO.itemId} to user ${userId}'s cart`, this.context);
    return this.cartService.addToCartService(userId, addToCartDTO);
  }
  



  // decrease item quantity
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('remove')
  @ApiOperation({ summary: 'Remove/decrease item quantity from user cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed or quantity decreased successfully',
    schema: {
      example: {
        _id: '6851b7b5786ecbff4c06e854 //THIS IS CARTId',
        userId: '684d51abab85e4eea0294410',
        couponCode: null,
        couponId: null,
        deliveryCharges: 2501,
        discount: 0,
        distanceInKm: 500,
        itemTotal: 19.98,
        items: [
          {
            itemId: '683d3dcb6728e2e8cc8dd6e4',
            name: 'Margherita Pizza',
            quantity: 2,
            price: 9.99,
            tax: 0.999,
          },
        ],
        platformFee: 9,
        restaurantId: '683d7adf339b913562146f00',
        subtotal: 19.98,
        tax: 0.999,
        total: 2530,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found in cart' })
  async removeItem(
    @Body() removeItemDTO: RemoveItemDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Removing item ${removeItemDTO.itemId} from user ${userId}'s cart`, this.context);
    return this.cartService.removeItemService(userId, removeItemDTO);
  }
  



  //delete cart
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Delete('delete')
  @ApiOperation({ summary: 'Delete user’s active cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart deleted successfully',
    schema: {
      example: {
        message: 'Cart deleted',
        userId: '1234567890',
      },
    },
  })
  
  @ApiResponse({ status: 404, description: 'Cart not found for user' })
  async deleteCart(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.warn(`Deleting cart for user ${userId}`, this.context);
    return this.cartService.deleteCartService(userId);
  }



  // Get user’s cart
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Get('get')
  @ApiTags('Cart')
  @ApiOperation({ summary: 'Get user’s active cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    schema: {
      example: {
        cart: {
          _id: '6851b7b5786ecbff4c06e854',
          userId: '684d51abab85e4eea0294410',
          couponCode: null,
          couponId: null,
          deliveryCharges: 2501,
          discount: 0,
          distanceInKm: 500,
          itemTotal: 19.98,
          items: [
            {
              itemId: '683d3dcb6728e2e8cc8dd6e4',
              name: 'Margherita Pizza',
              quantity: 2,
              price: 9.99,
              tax: 0.999,
            },
          ],
          platformFee: 9,
          restaurantId: '683d7adf339b913562146f00',
          subtotal: 19.98,
          tax: 0.999,
          total: 2530,
        },
        message: 'Cart is up to date',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cart updated with latest prices, availability, taxes, and totals',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart is empty',
    schema: {
      example: {
        cart: null,
        message: 'Your cart is empty',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart not found for user',
    schema: {
      example: {
        statusCode: 404,
        message: 'No active cart found',
        error: 'Not Found',
      },
    },
  })
  async getCart(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.verbose(`Fetching cart for user ${userId}`, this.context);
    return this.cartService.getCartService(userId);
  }
  

  // Get all available coupons for a restaurant
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Get('coupons/:restaurantId')
  @ApiOperation({ summary: 'Get all available coupons for a restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: 'string',
    required: true,
    description: 'The ID of the restaurant for which to fetch coupons',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupons retrieved successfully',
    schema: {
      example: [
        {
          _id: '683eb85ed2854d3aae7adc7f',
          code: 'SUMMER25',
          discountPercent: 25,
          maxDiscount: 100,
          expiryDate: '2025-12-31T23:59:59.999Z',
          minOrderAmount: 149,
          restaurantId: '684ab18ed5e1127595270ebc',
          isActive: true,
          createdAt: '2025-06-03T08:54:54.971Z',
          updatedAt: '2025-06-03T08:54:54.971Z',
          __v: 0,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant or coupons not found',
  })
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`, this.context);
    return this.cartService.viewCouponsService(restaurantId);
  }
  



  // Apply a coupon to user’s cart
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('applyCoupon/:couponId')
  @ApiOperation({ summary: 'Apply a coupon to the user’s cart' })
  @ApiParam({
    name: 'couponId',
    type: 'string',
    required: true,
    description: 'The ID of the coupon to apply',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon applied successfully',
    schema: {
      example: {
        message: 'Coupon applied successfully',
        newTotal: 2483,
        discountApplied: 100,
        couponCode: 'SUMMER25',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart or coupon not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Coupon not applicable or already applied',
  })
  async applyCoupon(
    @Param('couponId') couponId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Applying coupon ${couponId} to user ${userId}'s cart`, this.context);
    return this.cartService.applyCouponService(userId, couponId);
  }
  


  //remove coupon service
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('removeCoupon')
  @ApiOperation({ summary: 'Remove the applied coupon from the user’s cart' })
  @ApiResponse({
    status: 200,
    description: 'Coupon removed successfully',
    schema: {
      example: {
        message: 'Coupon removed successfully',
        newTotal: 2583,
        discountRemoved: 100,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @ApiResponse({ status: 400, description: 'No coupon was applied to the cart' })
  async removeCoupon(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.log(`Removing coupon from cart for user ${userId}`, this.context);
    return this.cartService.removeCouponService(userId);
  }
  
}
