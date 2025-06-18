import {
  Body,
  Controller,
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
  ApiOperation,
  ApiQuery,
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
  @UseGuards(GrpcAuthGuard)
  @Post('create/:managerId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a restaurant and assign to manager' })
  async createRestaurant(@Param('managerId') managerId: string, @Body() dto: CreateRestaurantDto) {
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
  @UseGuards(GrpcAuthGuard)
  @Get('manager/:managerId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getByManager(@Param('managerId') managerId: string) {
    return this.restaurantService.getRestaurantByManagerId(managerId);
  }

  /**
   * Get restaurants matching provided tags (Admin only)
   */
  @Get('tags')
  async getByTags(@Query('tags') tags?: string) {
    const tagArray = tags ? tags.split(',') : [];
    return this.restaurantService.findByTags(tagArray);
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
  @UseGuards(GrpcAuthGuard)
  @Post(':restaurantId/menu')
  @Roles(Role.ADMIN, Role.MANAGER)
  async createMenu(@Param('restaurantId') restaurantId: string, @Body() dto: CreateMenuItemDto) {
    return this.restaurantService.createMenuItem(restaurantId, dto);
  }

  /**
   * Get a specific menu item by restaurant ID and item ID
   */
  @Get(':restaurantId/menu/:itemId')
  async getMenuItemById(@Param('restaurantId') restaurantId: string, @Param('itemId') itemId: string) {
    return this.restaurantService.getItemById(restaurantId, itemId);
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
  @UseGuards(GrpcAuthGuard)
  @Get('search/food')
  @Roles(Role.USER)
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
