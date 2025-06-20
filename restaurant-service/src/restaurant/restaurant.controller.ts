import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';
import { CouponDto } from './dto/coupon.dto';
import { UpdateCoponDto } from './dto/updateCoupon.dto';
import { GrpcAuthGuard } from './guards/auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './common/role.enum';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { ManagerGuard } from './guards/manager.guard';
import { UpdateMenuItemDto } from './dto/updateMenuItem.dto';

interface MediaService {
  getSignedUrl(fileName: string, fileType: string, folderName: string): Promise<string>;
}

@Controller('restaurant')
@ApiTags('Restaurants')
@ApiBearerAuth()
export class RestaurantController {

  // Media service to get signed URLs from external gRPC service
  private readonly mediaService: MediaService;

  constructor(private readonly restaurantService: RestaurantService) { }

  /**
 * Creates a new restaurant and assigns it to the authenticated manager.
 * Requires JWT authentication and manager-specific authorization.
 *
 * @param dto The data transfer object containing the details for the new restaurant.
 * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
 * @returns The newly created restaurant object.
 */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT')
  @Post('create/:managerId') // Note: ':managerId' in path parameter seems redundant if managerId is taken from req.user.sub
  @ApiOperation({ summary: 'Create a restaurant and assign to manager' })
  async createRestaurant(@Body() dto: CreateRestaurantDto, @Req() req: any) {
    // The managerId from req.user.sub is used, so the ':managerId' path param might be redundant or for a different purpose.
    // If the path param is intended to be used, it should be retrieved via @Param('managerId')
    const managerId = req.user.sub;
    return this.restaurantService.createRestaurant(dto, managerId);
  }

  /**
 * Retrieves a paginated list of restaurants near specified geographical coordinates.
 *
 * @param latitude The latitude coordinate of the user's location.
 * @param longitude The longitude coordinate of the user's location.
 * @param req The request object, potentially containing user context for personalized results (e.g., from authentication middleware).
 * @param limit (Optional) The maximum number of restaurants to return per page. Defaults to 10.
 * @param offset (Optional) The number of restaurants to skip before starting to return results. Defaults to 0.
 * @returns A paginated list of restaurant objects sorted by proximity to the given coordinates.
 */
  @Get('nearby')
  @ApiOperation({ summary: 'Get restaurants nearby based on coordinates' })
  @ApiQuery({ name: 'latitude', type: Number, required: true })
  @ApiQuery({ name: 'longitude', type: Number, required: true })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  async getNearbyRestaurants(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Req() req: any,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    const user = req.user; // User context might be populated by guards or middleware
    return this.restaurantService.getNearbyRestaurants(latitude, longitude, +limit, +offset, user);
  }

  /**
 * Retrieves a paginated list of all restaurants.
 * Requires authentication and the 'ADMIN' role.
 *
 * @param limit (Optional) The maximum number of restaurants to return per page. Defaults to 10.
 * @param offset (Optional) The number of restaurants to skip before starting to return results. Defaults to 0.
 * @returns A paginated list of restaurant objects.
 */
  @UseGuards(GrpcAuthGuard)
  @Get('all')
  @Roles(Role.ADMIN)
  async getAllRestaurants(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.restaurantService.getAllRestaurants(+limit, +offset);
  }

  /**
 * Updates an existing restaurant's details by its ID.
 * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
 *
 * @param id The unique identifier of the restaurant to update.
 * @param dto The data transfer object containing the updated restaurant details.
 * @returns The successfully updated restaurant object.
 */
  @UseGuards(GrpcAuthGuard)
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateRestaurant(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateRestaurant(id, dto);
  }

  /**
 * Retrieves the restaurant associated with the authenticated manager.
 * Requires JWT authentication and manager-specific authorization.
 *
 * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
 * @returns The restaurant object managed by the authenticated manager, or throws a NotFound exception if no restaurant is linked.
 */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @Get('manager')
  @ApiBearerAuth('JWT')
  async getByManager(@Req() req: any) {
    const managerId = req.user.sub; // Extracts manager ID from the authenticated user's payload
    return await this.restaurantService.getRestaurantByManagerId(managerId);
  }

  /**
 * Retrieves restaurants based on a comma-separated list of tags.
 *
 * @param tags (Optional) A comma-separated string of tags (e.g., "fastfood,pizza,vegetarian") to filter restaurants.
 * @returns A list of restaurant objects that match any of the provided tags.
 */
  @Get('tags')
  async getByTags(@Query('tags') tags?: string) {
    const tagArray = tags ? tags.split(',') : [];
    return await this.restaurantService.findByTags(tagArray);
  }

  /**
 * Generates a pre-signed URL for uploading a restaurant image.
 * This endpoint is typically used by the client to get a secure URL to upload a file directly to storage (e.g., S3).
 * Requires either the 'ADMIN' or 'MANAGER' role.
 *
 * @param body An object containing the name and type of the file to be uploaded.
 * @param body.fileName The desired name of the file (e.g., "my-restaurant-logo.png").
 * @param body.fileType The MIME type of the file (e.g., "image/jpeg", "image/png").
 * @returns An object containing the pre-signed URL for file upload.
 */
  @Post('signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRestaurantImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
    return { signedUrl };
  }

  /**
 * Generates a pre-signed URL for uploading a menu item image.
 * This endpoint is typically used by the client to get a secure URL to upload a file directly to storage (e.g., S3).
 * Requires either the 'ADMIN' or 'MANAGER' role.
 *
 * @param body An object containing the name and type of the file to be uploaded.
 * @param body.fileName The desired name of the file (e.g., "my-menu-item-image.jpg").
 * @param body.fileType The MIME type of the file (e.g., "image/jpeg", "image/png").
 * @returns An object containing the pre-signed URL for file upload.
 */
  @Post('menu/signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getMenuImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'menu');
    return { signedUrl };
  }

  /**
  * Creates a new menu item for the authenticated manager's restaurant.
  * Requires JWT authentication and manager-specific authorization.
  *
  * @param dto The data transfer object containing the details for the new menu item.
  * @param req The request object, containing user information (specifically manager ID) from the JWT payload.
  * @returns The newly created menu item object.
  */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT')
  @Post('/menu')
  async createMenu(@Body() dto: CreateMenuItemDto, @Req() req: any) {
    const managerId = req.user.sub; // Extracts manager ID from the authenticated user's payload
    return this.restaurantService.createMenuItem(dto, managerId);
  }

  /**
 * Retrieves a single menu item by its ID for a specific restaurant.
 *
 * @param restaurantId The unique identifier of the restaurant the menu item belongs to.
 * @param itemId The unique identifier of the menu item to retrieve.
 * @returns The menu item object if found, otherwise throws a NotFound exception.
 */
  @Get(':restaurantId/menu/:itemId')
  async getMenuItemById(@Param('restaurantId') restaurantId: string, @Param('itemId') itemId: string) {
    return this.restaurantService.getItemById(restaurantId, itemId);
  }

  /**
 * Updates an existing menu item.
 * Allows for partial or full updates of a menu item's details.
 *
 * @param itemId The unique identifier of the menu item to update.
 * @param updateMenuItemDto The data transfer object containing the fields to update for the menu item.
 * @returns The successfully updated menu item.
 */
  @Put('menuItem/:itemId')
  @ApiOperation({ summary: 'Update an existing menu item' }) // Overall description of the endpoint
  @ApiParam({
    name: 'itemId',
    description: 'The ID of the menu item to update',
    type: String,
    example: '60c72b2f9b1e8a001c8e4d3a',
  })
  @ApiBody({
    type: UpdateMenuItemDto,
    description: 'Data to update the menu item',
    examples: {
      partialUpdate: {
        summary: 'Update price and description',
        value: {
          price: 15.99,
          description: 'A delicious new description for the dish.',
        },
      },
      fullUpdate: {
        summary: 'Full update of menu item details',
        value: {
          name: 'Spicy New Burger',
          description: 'Our classic burger with a spicy kick!',
          price: 12.50,
          imageUrl: 'http://example.com/spicy-burger.jpg',
          tags: ['spicy', 'burger', 'new'],
          copons: ['SUMMER20'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The menu item has been successfully updated.',
    type: CreateMenuItemDto, // Assuming the response shape is similar to CreateMenuItemDto
  })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async updateMenuItem(@Param('itemId') itemId: string, @Body() updateMenuItemDto: UpdateMenuItemDto) {
    return await this.restaurantService.updateMenuItem(itemId, updateMenuItemDto);
  }

  /**
 * Deletes a specific menu item by its ID.
 *
 * @param itemId The unique identifier of the menu item to delete.
 * @returns The deleted menu item object, or throws a NotFound exception if the item does not exist.
 */
  @Delete('menu/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    return await this.restaurantService.deleteItem(itemId);
  }

  /**
 * Retrieves all menu items for a specific restaurant.
 *
 * @param restaurantId The unique identifier of the restaurant for which to retrieve menu items.
 * @returns A list of menu item objects associated with the specified restaurant.
 */

  // @UseGuards(JwtAuthGuard, ManagerGuard)
  // @ApiBearerAuth('JWT')
  @Get(':restaurantId/menu')
  async getMenuItems(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getMenuItems(restaurantId);
  }

  /**
   * Retrieves all menu items for that specific manager.
   * 
   * @param req taken this to get manager ID  from  token.
   * @returns A list of menu items of the restaurant to that specific manager.
   */
  @Get('menuItem')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT')
  async getMenuItemForManager(@Req() req: any){
    const managerId = req.user.sub;
    console.log(managerId);
    return await this.restaurantService.getMenuItemForManager(managerId);
  }

  /**
 * Retrieves all coupons associated with a specific restaurant.
 *
 * @param restaurantId The unique identifier of the restaurant for which to retrieve coupons.
 * @returns A list of coupon objects associated with the specified restaurant.
 */
  @Get('coupons/:restaurantId')
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    return await this.restaurantService.getCoupons(restaurantId);
  }


  /**
 * Creates a new coupon for a specific restaurant.
 * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
 *
 * @param restaurantId The unique identifier of the restaurant for which the coupon is being created.
 * @param dto The data transfer object containing the details of the new coupon.
 * @returns The newly created coupon object.
 */
  @UseGuards(GrpcAuthGuard)
  @Post('coupons/:restaurantId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async createCoupon(@Param('restaurantId') restaurantId: string, @Body() dto: CouponDto) {
    return this.restaurantService.createCoupon(restaurantId, dto);
  }


  /**
 * Updates an existing coupon by its ID.
 * Requires authentication and either the 'ADMIN' or 'MANAGER' role.
 *
 * @param couponId The unique identifier of the coupon to update.
 * @param dto The data transfer object containing the updated coupon details.
 * @returns The updated coupon object.
 */
  @UseGuards(GrpcAuthGuard)
  @Put('coupons/:couponId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateCoupon(@Param('couponId') couponId: string, @Body() dto: UpdateCoponDto) {
    return this.restaurantService.updateCoupon(couponId, dto);
  }

  /**
 * Searches for restaurants that offer a specific food item.
 * Requires user authentication and the 'USER' role.
 *
 * @param query The food item to search for (e.g., "pizza", "sushi").
 * @returns A list of restaurants that offer the specified food, or an empty array if none are found.
 */
  @UseGuards(GrpcAuthGuard)
  @Get('search/food')
  @Roles(Role.USER)
  async searchByFood(@Query('q') query: string) {
    return this.restaurantService.searchRestaurantsByFood(query);
  }


  /**
 * Retrieves a single restaurant by its ID.
 * @param id The unique identifier of the restaurant.
 * @returns The restaurant object if found, otherwise throws a NotFound exception.
 */
  @Get(':id')
  async getRestaurantById(@Param('id') id: string) {
    return this.restaurantService.getRestaurantById(id);
  }
}
