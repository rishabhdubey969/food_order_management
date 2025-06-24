import { Controller, Delete, Get, Param, Post, Req, UseGuards, Body, ValidationPipe, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody, ApiBearerAuth, ApiBadRequestResponse, ApiNotFoundResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles } from './decorator/role.decorator';
import { GrpcAuthGuard } from './guards/auth.guard';
import { Role } from './common/role.enum';
import { WinstonLogger } from '../logger/winston-logger.service';
import { AddCartDto } from './dto/addCart.dto';
import { RemoveItemDto } from './dto/removeItem.dto';
import { MultipleItemDto } from './dto/multipleItem.dto';




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
  @ApiBearerAuth('JWT')
  @Post('add')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiBody({
    type: AddCartDto,
    examples: {
      default: {
        summary: 'Sample add-to-cart payload',
        value: {
          restaurantId: '64a51abab85e4eea0294410',
          itemId: '63d3dcb6728e2e8cc8dd6e4',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added to cart successfully',
    schema: {
      example: {
        _id: '6851b7b5786ecbff4c06e854',
        userId: '684d51abab85e4eea0294410',
        restaurantId: '683d7adf339b913562146f00',
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
        subtotal: 29.97,
        tax: 1.4985,
        total: 2541,
        createdAt: '2024-06-20T10:00:00.000Z',
        updatedAt: '2024-06-20T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for input DTO',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-06-11T10:00:00.000Z',
        path: '/cart/add',
        method: 'POST',
        message: ['restaurantId must be a valid MongoDB ObjectId', 'itemId should not be empty'],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item or restaurant not found',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-06-11T10:00:00.000Z',
        path: '/cart/add',
        method: 'POST',
        message: 'Restaurant not found',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Cart alreday exit for another restaurant first clear it',
    schema: {
      example: {
        statusCode: 409,
        timestamp: '2025-06-11T10:00:00.000Z',
        path: '/cart/add',
        method: 'POST',
        message: 'Item is currently unavailable',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal server error',
    schema: {
      example: {
        statusCode: 500,
        timestamp: '2025-06-11T10:00:00.000Z',
        path: '/cart/add',
        method: 'POST',
        message: 'Failed to fetch cart after update',
      },
    },
  })
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
  @ApiOperation({ summary: 'Remove or decrease item quantity from user cart' })
  @ApiBody({
    description: 'Payload to remove or decrease the quantity of an item in the cart',
    type: RemoveItemDto,
    examples: {
      removeExample: {
        summary: 'Remove a pizza item from cart',
        value: {
          itemId: '63d3dcb6728e2e8cc8dd6e4',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed or quantity decreased successfully',
    schema: {
      example: {
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
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cart or item not found in cart',
    schema: {
      example: {
        statusCode: 404,
        message: 'Item not found in cart',
        path: '/cart/remove',
        method: 'POST',
        timestamp: '2025-06-11T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input provided',
    schema: {
      example: {
        statusCode: 400,
        message: ['itemId must be a valid MongoDB ObjectId'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to access this resource',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error while updating the cart',
    schema: {
      example: {
        statusCode: 500,
        message: 'An unknown error occurred',
        error: 'Internal Server Error',
      },
    },
  })
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
    status: HttpStatus.OK,
    description: 'Cart deleted successfully',
    schema: {
      example: {
        message: 'Cart deleted',
        userId: '1234567890',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No cart found for user',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cart not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User lacks necessary permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error while deleting the cart',
    schema: {
      example: {
        statusCode: 500,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
      },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user’s active cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart is up to date',
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
    status: HttpStatus.OK,
    description: 'Cart updated with latest prices, availability, taxes, and totals',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart is empty',
    schema: {
      example: {
        cart: null,
        message: 'Your cart has been deleted as all items are unavailable or removed.',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No active cart found for user',
    schema: {
      example: {
        statusCode: 404,
        message: 'No active cart found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied due to insufficient role',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Unexpected server error occurred',
        error: 'Internal Server Error',
      },
    },
  })
  async getCart(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.log(`Fetching cart for user ${userId}`, this.context);
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available coupons for a restaurant' })
  @ApiParam({
    name: 'restaurantId',
    type: 'string',
    required: true,
    description: 'The ID of the restaurant to fetch coupons for',
    example: '684ab18ed5e1127595270ebc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
  @ApiNotFoundResponse({
    description: 'No coupons found for this restaurant',
    schema: {
      example: {
        statusCode: 404,
        message: 'No active coupons available',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied due to role restrictions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async getCoupons(@Param('restaurantId', ValidationPipe) restaurantDto: string) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantDto}`, this.context);
    return this.cartService.viewCouponsService(restaurantDto);
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a coupon to the user’s cart' })
  @ApiParam({
    name: 'couponId',
    type: 'string',
    required: true,
    description: 'The ID of the coupon to apply',
    example: '684ab18ed5e1127595270ebc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
  @ApiBadRequestResponse({
    description: 'Coupon not applicable or already applied',
    schema: {
      example: {
        statusCode: 400,
        message: 'A coupon has already been applied to this cart.',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Cart or coupon not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Coupon not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing token.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have access rights.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async applyCoupon(@Param('couponId') couponId: string, @Req() req: any) {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove the applied coupon from the user’s cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon removed successfully',
    schema: {
      example: {
        message: 'Coupon removed successfully',
        newTotal: 2583,
        discountRemoved: 100,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No coupon was applied to the cart',
    schema: {
      example: {
        statusCode: 400,
        message: 'No coupon is currently applied to the cart.',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Cart not found for user',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cart not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Invalid or missing JWT token.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. User does not have the right role.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error. Unexpected error on the server.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
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
  @ApiResponse({
    status: 200,
    description: 'Cart is empty and has been deleted',
    schema: {
      example: {
        message: 'Cart is empty and has been deleted',
        cart: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant or one or more menu items not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Item with ID 64b1234567890abcdef12345 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Restaurant mismatch or item unavailable',
    schema: {
      example: {
        statusCode: 409,
        message: 'Item Chicken Burger is unavailable',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error while updating cart',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to update or create cart',
        error: 'Internal Server Error',
      },
    },
  })
  async updateCart(@Req() req: any, @Body() body: MultipleItemDto) {
    const userId = req.user.sub;
    this.logger.log(`Updating cart for user ${userId}`, this.context);
    return this.cartService.updateCartService(userId, body);
  }
}
