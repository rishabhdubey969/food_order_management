import { Controller, Delete, Get, Param, Post, Req, UseGuards, Body } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Roles } from './decorator/role.decorator';
import { GrpcAuthGuard } from './guards/auth.guard';
import { Role } from './common/role.enum';
import { WinstonLogger } from '../logger/winston-logger.service';
import { AddCartDto } from './dto/addCart.dto';
import { RemoveItemDto } from './dto/removeItem.dto';
import { MultipleItemDto } from './dto/multipleItem.dto';
import { CouponDto, RestaurantDto } from './dto/param.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  private readonly context = CartController.name;

  constructor(
    private readonly cartService: CartService,
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * Add an item to the user's cart or Increase the quantity of an item by one in the user's cart
   *
   * This endpoint allows an authenticated user with the role 'USER' to add a specific item
   * from a restaurant to their shopping cart. If the cart does not exist, it is created.
   * If a cart exists with a different restaurant, a conflict error is thrown.
   *
   * Swagger documentation is provided via decorators to describe the payload,
   * successful response structure, and possible error responses.
   *
   * @param {AddCartDto} addToCartDTO - The DTO containing restaurantId and itemId.
   * @param {any} req - The request object containing authenticated user details.
   * @returns {Promise<any>} The updated or newly created cart with item, tax, and totals.
   *
   * @throws {NotFoundException} If the restaurant or item is not found.
   * @throws {ConflictException} If a cart already exists with a different restaurant.
   */
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('add')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiBody({
    description: 'Payload to add an item to the cart',
    schema: {
      type: 'object',
      properties: {
        restaurantId: {
          type: 'string',
          description: 'The ID of the restaurant',
          example: '64a51abab85e4eea0294410',
        },
        itemId: {
          type: 'string',
          description: 'The ID of the item to be added to the cart',
          example: '63d3dcb6728e2e8cc8dd6e4',
        },
      },
    },
  })
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
  async addToCart(@Body() addToCartDTO: AddCartDto, @Req() req: any) {
    const userId = req.user.sub;
    this.logger.log(`Adding item ${addToCartDTO.itemId} to user ${userId}'s cart`, this.context);
    return this.cartService.addToCartService(userId, addToCartDTO);
  }

  /**
   * Decrease the quantity of an item by one in the user's cart or remove it entirely if quantity becomes zero.
   *
   * This endpoint is secured with gRPC auth guard and restricted to users with the 'USER' role.
   * It takes an `itemId` in the request body and finds the corresponding item in the user's cart.
   *
   * - If the item exists and has quantity > 1, it will be decremented by 1.
   * - If the item's quantity is 1, it will be removed from the cart.
   * - If it was the only item in the cart, the cart itself will be deleted.
   *
   * Swagger annotations document request/response schemas and possible HTTP codes.
   *
   * @param {RemoveItemDto} removeItemDTO - DTO containing the `itemId` to be decreased or removed.
   * @param {any} req - The request object containing the authenticated user's information.
   * @returns {Promise<any>} The updated cart after item removal or a message if cart is deleted.
   *
   * @throws {NotFoundException} If the cart or the item is not found in the cart.
   */
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('remove')
  @ApiOperation({ summary: 'Remove/decrease item quantity from user cart' })
  @ApiBody({
    description: 'Payload to remove or decrease the quantity of an item in the cart',
    schema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'The ID of the item to be removed or decreased in quantity',
          example: '63d3dcb6728e2e8cc8dd6e4',
        },
      },
    },
  })
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
  async removeItem(@Body() removeItemDTO: RemoveItemDto, @Req() req: any) {
    const userId = req.user.sub;
    this.logger.log(`Removing item ${removeItemDTO.itemId} from user ${userId}'s cart`, this.context);
    return this.cartService.removeItemService(userId, removeItemDTO);
  }

  /**
   * Delete the authenticated user's active cart.
   *
   * This endpoint is protected by the gRPC authentication guard and allows only users with the 'USER' role.
   * It retrieves the user ID from the request object and calls the cart service to delete the user's cart.
   *
   * If a cart exists, it is deleted and a success message is returned. If no cart is found, a 404 response is returned.
   *
   * Swagger decorators describe the endpoint's purpose, expected responses, and possible errors.
   *
   * @param {any} req - The HTTP request object containing the authenticated user's details.
   * @returns {Promise<any>} An object with a success message and the user ID if the cart was deleted.
   *
   * @throws {NotFoundException} If the user's cart does not exist.
   */
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

  /**
   * Retrieves the authenticated user's active cart.
   *
   * This endpoint is protected by gRPC-based authentication and is accessible only to users with the 'USER' role.
   * It fetches the user's cart from the database and ensures all items are valid and available.
   *
   * - If all items are valid and no changes are required, the original cart is returned with a message: "Cart is up to date".
   * - If item prices or availability have changed, the cart is updated and returned with a message: "Cart updated with latest prices, availability, taxes, and totals".
   * - If all items are removed (invalid/unavailable/quantity zero), the cart is deleted and a message is returned: "Your cart is empty".
   * - If no cart exists for the user, a 404 response is returned.
   *
   * Swagger decorators are used to provide detailed API documentation for each possible response.
   *
   * @param {any} req - The HTTP request object containing the authenticated user's data.
   * @returns {Promise<{ cart: any | null; message: string }>} A response containing the user's cart or an empty cart message.
   *
   * @throws {NotFoundException} If the user does not have an active cart in the database.
   */
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

  /**
   * Retrieves all active coupons available for a specific restaurant.
   *
   * This endpoint is protected by gRPC authentication and restricted to users with the 'USER' role.
   * It accepts a restaurant ID as a route parameter and fetches all valid and active coupons
   * for the given restaurant from the service layer.
   *
   * - Returns a list of coupon objects if found.
   * - Returns a 404 error if the restaurant does not exist or has no active coupons.
   *
   * Swagger decorators are used to document the route, parameter details, and possible responses.
   *
   * @param {string} restaurantId - The ID of the restaurant to fetch coupons for.
   * @returns {Promise<any>} A list of active coupons for the specified restaurant.
   *
   * @throws {NotFoundException} If the restaurant or its coupons are not found.
   */
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
  async getCoupons(@Param('restaurantId') restaurantId: RestaurantDto) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`, this.context);
    return this.cartService.viewCouponsService(restaurantId);
  }

  /**
   * Applies a coupon to the authenticated user's cart.
   *
   * This endpoint is protected by gRPC authentication and accessible only to users with the 'USER' role.
   * It receives a coupon ID as a route parameter and attempts to apply the coupon to the user's active cart.
   *
   * - Validates whether the user's cart exists.
   * - Checks if the coupon is valid, applicable, and not already applied.
   * - Applies the coupon, recalculates totals with the discount, and updates the cart.
   *
   * Swagger decorators provide detailed documentation for the route, parameters, and all possible responses:
   * - 200: Coupon applied successfully, returns the updated total, discount applied, and coupon code.
   * - 404: Cart or coupon not found.
   * - 400: Coupon is invalid, expired, already applied, or not applicable to the cart.
   *
   * @param {string} couponId - The ID of the coupon to apply.
   * @param {any} req - The HTTP request object containing the authenticated user's data.
   * @returns {Promise<object>} An object containing a success message, new total, discount applied, and coupon code.
   *
   * @throws {NotFoundException} If the cart or coupon is not found.
   * @throws {BadRequestException} If the coupon is not applicable or already applied.
   */
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
  async applyCoupon(@Param('couponId') couponId: CouponDto, @Req() req: any) {
    const userId = req.user.sub;
    this.logger.log(`Applying coupon ${couponId} to user ${userId}'s cart`, this.context);
    return this.cartService.applyCouponService(userId, couponId);
  }

  /**
   * Removes an applied coupon from the authenticated user's cart.
   *
   * This endpoint is protected with gRPC-based authentication and only accessible to users with the 'USER' role.
   * It removes the currently applied coupon from the user's cart (if any), recalculates totals without the discount,
   * and updates the cart accordingly.
   *
   * - Validates whether the cart exists for the user.
   * - Checks if a coupon is currently applied.
   * - If a coupon exists, it removes the coupon, resets discount values, and recalculates the total.
   *
   * Swagger decorators describe the expected behavior:
   * - 200: Coupon removed successfully, returns the updated total and amount of discount removed.
   * - 404: Cart not found for the user.
   * - 400: No coupon was applied to the cart.
   *
   * @param {any} req - The HTTP request object containing the authenticated user's data.
   * @returns {Promise<object>} A response object indicating the coupon was removed and showing the updated totals.
   *
   * @throws {NotFoundException} If no cart exists for the user.
   * @throws {BadRequestException} If there was no coupon applied to the cart.
   */
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

  /**
   * Updates the user's cart with new items and quantities.
   *
   * This endpoint checks if a cart exists for the authenticated user. If not, it creates one.
   * If a cart exists, it updates the cart with the latest items, quantities, and recalculated totals.
   * Zero-quantity items are removed. If all items are zero or unavailable, the cart is deleted.
   *
   * - Validates item existence and availability.
   * - Calculates tax, distance, and delivery charges.
   * - Applies pricing and totals update logic.
   *
   * Protected by gRPC Auth Guard and accessible only by users with the 'USER' role.
   *
   * @param {any} req - The request object containing the authenticated user's ID.
   * @param {MultipleItemDto} body - Contains the restaurant ID and list of items with itemId and quantity.
   * @returns {Promise<object>} Returns the updated or newly created cart, or a message if deleted.
   *
   * @throws {NotFoundException} If the restaurant or item is not found.
   * @throws {ConflictException} If items are unavailable or restaurant mismatch.
   */
  @UseGuards(GrpcAuthGuard)
  @Roles(Role.USER)
  @Post('updateCart')
  @ApiOperation({ summary: 'Update user’s cart with new items and quantities' })
  @ApiResponse({
    status: 200,
    description: 'Cart updated successfully or deleted if items are zero',
    schema: {
      example: {
        message: 'Cart updated successfully',
        cart: {
          _id: '685456555d88a5efcacf288b',
          userId: '684d51abab85e4eea0294410',
          deliveryCharges: 8690,
          distanceInKm: 1737.94,
          itemTotal: 8000,
          items: [
            {
              itemId: '684acd94e22a8c3658c49d02',
              name: 'Paneer',
              quantity: 2,
              price: 1000,
              tax: 200,
            },
          ],
          platformFee: 9,
          restaurantId: '684ab19bd5e1127595270ebe',
          subtotal: 8000,
          tax: 200,
          total: 10209,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Restaurant or menu item not found' })
  @ApiResponse({ status: 409, description: 'Restaurant mismatch or item unavailable' })
  @ApiResponse({ status: 500, description: 'Internal server error while updating cart' })
  async updateCart(@Req() req: any, @Body() body: MultipleItemDto) {
    const userId = req.user.sub;
    this.logger.log(`Updating cart for user ${userId}`, this.context);
    return this.cartService.updateCartService(userId, body);
  }
}
