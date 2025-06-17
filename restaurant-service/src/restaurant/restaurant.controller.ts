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
  ApiBody,
  ApiConsumes,
  ApiOperation,
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

interface MediaService {
  getSignedUrl(fileName: string, fileType: string, folderName: string): Promise<string>;
}

@ApiTags('Restaurants')
@ApiBearerAuth()
@Controller('restaurant')
export class RestaurantController {
  private readonly mediaService: MediaService;

  constructor(private readonly restaurantService: RestaurantService) {}

  @UseGuards(GrpcAuthGuard)
  @Post('create/:managerId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a restaurant and assign to manager' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  @ApiBody({ type: CreateRestaurantDto })
  async createRestaurant(
    @Param('managerId') managerId: string,
    @Body() dto: CreateRestaurantDto,
  ) {
    return this.restaurantService.createRestaurant(dto, managerId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get restaurants nearby based on coordinates' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Nearby restaurants fetched successfully' })
  async getNearbyRestaurants(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.restaurantService.getNearbyRestaurants(latitude, longitude, +limit, +offset, user);
  }

  @UseGuards(GrpcAuthGuard)
  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all restaurants (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurants retrieved successfully' })
  async getAllRestaurants(
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.restaurantService.getAllRestaurants(+limit, +offset);
  }

  @UseGuards(GrpcAuthGuard)
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update restaurant by ID' })
  @ApiBody({ type: UpdateRestaurantDto })
  async updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantService.updateRestaurant(id, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @Get('manager/:managerId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get restaurant managed by specific manager' })
  async getByManager(@Param('managerId') managerId: string) {
    return this.restaurantService.getRestaurantByManagerId(managerId);
  }

  @UseGuards(GrpcAuthGuard)
  @Get('tags')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get restaurants by tags (comma-separated)' })
  @ApiQuery({ name: 'tags', required: false, type: String })
  async getByTags(@Query('tags') tags?: string) {
    const tagArray = tags ? tags.split(',') : [];
    return this.restaurantService.findByTags(tagArray);
  }

  @Post('signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate signed URL for uploading restaurant image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        fileType: { type: 'string' },
      },
    },
  })
  async getRestaurantImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
    return { signedUrl };
  }

  @Post('menu/signed-url')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate signed URL for uploading menu image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        fileType: { type: 'string' },
      },
    },
  })
  async getMenuImageSignedUrl(@Body() body: { fileName: string; fileType: string }) {
    const { fileName, fileType } = body;
    const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'menu');
    return { signedUrl };
  }

  @UseGuards(GrpcAuthGuard)
  @Post(':restaurantId/menu')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Add a new menu item to a restaurant' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMenuItemDto })
  async createMenu(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.restaurantService.createMenuItem(restaurantId, dto);
  }

  @Get(':restaurantId/menu/:itemId')
  @ApiOperation({ summary: 'Get menu item by its ID' })
  async getMenuItemById(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.restaurantService.getItemById(restaurantId, itemId);
  }

  @Get(':restaurantId/menu')
  @ApiOperation({ summary: 'Get all menu items of a restaurant' })
  async getMenuItems(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getMenuItems(restaurantId);
  }

  @Get('coupons/:restaurantId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get all coupons of a restaurant' })
  async getCoupons(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getCoupons(restaurantId);
  }

  @Post('coupons/:restaurantId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new coupon for a restaurant' })
  @ApiBody({ type: CouponDto })
  async createCoupon(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CouponDto,
  ) {
    return this.restaurantService.createCoupon(restaurantId, dto);
  }

  @Put('coupons/:couponId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a coupon by ID' })
  @ApiBody({ type: UpdateCoponDto })
  async updateCoupon(
    @Param('couponId') couponId: string,
    @Body() dto: UpdateCoponDto,
  ) {
    return this.restaurantService.updateCoupon(couponId, dto);
  }

  @Get('search/food')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Search restaurants by food name' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Food name query' })
  async searchByFood(@Query('q') query: string) {
    return this.restaurantService.searchRestaurantsByFood(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant fetched successfully' })
  async getRestaurantById(@Param('id') id: string) {
    return this.restaurantService.getRestaurantById(id);
  }
}
