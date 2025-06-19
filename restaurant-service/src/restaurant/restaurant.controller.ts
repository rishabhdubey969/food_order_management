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
import { RolesGuard } from './guards/roles.guard';
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

  constructor(private readonly restaurantService: RestaurantService) {}

  /**
   * Create a restaurant and assign it to a manager (Admin only)
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT') 
  @Post('create/:managerId')
  @ApiOperation({ summary: 'Create a restaurant and assign to manager' })
  async createRestaurant(@Body() dto: CreateRestaurantDto, @Req()req: any) {
    const managerId = req.user.sub;
    return this.restaurantService.createRestaurant(dto, managerId);
  }

/**
 * Get restaurants nearby based on user coordinates (open to all users)
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
    const user = req.user;
    return this.restaurantService.getNearbyRestaurants(latitude, longitude, +limit, +offset, user);
}

  /**
   * Admin-only route to get a paginated list of all restaurants
   */
  @UseGuards(GrpcAuthGuard)
  @Get('all')
  @Roles(Role.ADMIN)
  async getAllRestaurants(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.restaurantService.getAllRestaurants(+limit, +offset);
  }

  /**
   * Update an existing restaurant (Admin or assigned Manager only)
   */
  @UseGuards(GrpcAuthGuard)
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateRestaurant(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateRestaurant(id, dto);
  }

  /**
   * Get restaurant managed by a specific manager (Admin or that Manager)
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @Get('manager')
  @ApiBearerAuth('JWT') 
  async getByManager(@Req() req: any) {
    const managerId = req.user.sub;
    return await this.restaurantService.getRestaurantByManagerId(managerId);
  }

  /**
   * Get restaurants matching provided tags (Admin only)
   */
  @Get('tags')
  async getByTags(@Query('tags') tags?: string) {
    const tagArray = tags ? tags.split(',') : [];
    return await this.restaurantService.findByTags(tagArray);
  }

  /**
   * Generate signed URL for uploading a restaurant image (Admin/Manager)
   */
  @Post('signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRestaurantImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
    return { signedUrl };
  }

  /**
   * Generate signed URL for uploading a menu image (Admin/Manager)
   */
  @Post('menu/signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getMenuImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'menu');
    return { signedUrl };
  }

  /**
   * Add a new menu item to a restaurant (Admin/Manager only)
   */
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @ApiBearerAuth('JWT') 
  @Post('/menu')
  async createMenu(@Body() dto: CreateMenuItemDto, @Req() req: any) {
    const managerId = req.user.sub;
    return this.restaurantService.createMenuItem(dto, managerId);
  }

  /**
   * Get a specific menu item by restaurant ID and item ID
   */
  @Get(':restaurantId/menu/:itemId')
  async getMenuItemById(@Param('restaurantId') restaurantId: string, @Param('itemId') itemId: string) {
    return this.restaurantService.getItemById(restaurantId, itemId);
  }

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
  async updateMenuItem(@Param('itemId') itemId: string, @Body()updateMenuItemDto: UpdateMenuItemDto){
    return await this.restaurantService.updateMenuItem(itemId, updateMenuItemDto);
  }

  @Delete('menu/:itemId')
  async deleteItem(@Param('itemId') itemId: string){
    return await this.restaurantService.deleteItem(itemId);
  }
  
  /**
   * Get all menu items for a given restaurant
   */
  @Get(':restaurantId/menu')
  async getMenuItems(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getMenuItems(restaurantId);
  }

  /**
   * Get all coupons for a restaurant (Admin/Manager only)
   */
  @Get('coupons/:restaurantId')
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    return await this.restaurantService.getCoupons(restaurantId);
  }

  /**
   * Create a new coupon for a restaurant (Admin/Manager only)
   */
  @UseGuards(GrpcAuthGuard)
  @Post('coupons/:restaurantId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async createCoupon(@Param('restaurantId') restaurantId: string, @Body() dto: CouponDto) {
    return this.restaurantService.createCoupon(restaurantId, dto);
  }

  /**
   * Update an existing coupon (Admin/Manager only)
   */
  @UseGuards(GrpcAuthGuard)
  @Put('coupons/:couponId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateCoupon(@Param('couponId') couponId: string, @Body() dto: UpdateCoponDto) {
    return this.restaurantService.updateCoupon(couponId, dto);
  }

  /**
   * Search restaurants by food item name (User role)
   */
  // @UseGuards(GrpcAuthGuard)
  @Get('search/food')
  // @Roles(Role.USER)
  async searchByFood(@Query('q') query: string) {
    return this.restaurantService.searchRestaurantsByFood(query);
  }

  /**
   * Get a restaurant by its ID
   */
  @Get(':id')
  async getRestaurantById(@Param('id') id: string) {
    return this.restaurantService.getRestaurantById(id);
  }
}
