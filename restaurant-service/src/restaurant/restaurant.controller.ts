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
  @UseGuards(GrpcAuthGuard)
  @Controller('restaurant')
  export class RestaurantController {
    private  readonly mediaService: MediaService;
  
    constructor(private readonly restaurantService: RestaurantService) {}
  
    @Post('create/:managerId')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a restaurant' })
    @ApiResponse({ status: 201, description: 'Restaurant created successfully.' })
    async createRestaurant(
      @Param('managerId') managerId: string,
      @Body() dto: CreateRestaurantDto,
    ) {
      return this.restaurantService.createRestaurant(dto, managerId);
    }
  
    @Get('nearby')
    @Roles(Role.USER)
    @ApiOperation({ summary: 'Get nearby restaurants' })
    @ApiQuery({ name: 'latitude', required: true })
    @ApiQuery({ name: 'longitude', required: true })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
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
  
    @Get('all')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all restaurants' })
    async getAllRestaurants(
      @Query('limit') limit = 10,
      @Query('offset') offset = 0,
    ) {
      return this.restaurantService.getAllRestaurants(+limit, +offset);
    }
  
    @Put(':id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Update a restaurant' })
    async updateRestaurant(
      @Param('id') id: string,
      @Body() dto: UpdateRestaurantDto,
    ) {
      return this.restaurantService.updateRestaurant(id, dto);
    }
  
    @Get('manager/:managerId')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get restaurant by manager ID' })
    async getByManager(@Param('managerId') managerId: string) {
      return this.restaurantService.getRestaurantByManagerId(managerId);
    }
  
    @Get('tags')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get restaurants by tags' })
    @ApiQuery({ name: 'tags', required: false })
    async getByTags(@Query('tags') tags?: string) {
      const tagArray = tags ? tags.split(',') : [];
      return this.restaurantService.findByTags(tagArray);
    }
  
    @Post('signed-url')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get signed URL for restaurant image' })
    async getRestaurantImageSignedUrl(
      @Body() body: { fileName: string; fileType: string },
    ) {
      const { fileName, fileType } = body;
      const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
      return { signedUrl };
    }
  
    @Post('menu/signed-url')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get signed URL for menu item image' })
    async getMenuImageSignedUrl(
      @Body() body: { fileName: string; fileType: string },
    ) {
      const { fileName, fileType } = body;
      const signedUrl = await this.mediaService.getSignedUrl(fileName, fileType, 'menu');
      return { signedUrl };
    }
  
    @Post(':restaurantId/menu')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create menu item' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateMenuItemDto })
    async createMenu(
      @Param('restaurantId') restaurantId: string,
      @Body() dto: CreateMenuItemDto,
    ) {
      return this.restaurantService.createMenuItem(restaurantId, dto);
    }
  
    @Get(':restaurantId/menu/:itemId')
    @ApiOperation({ summary: 'Get menu item by ID' })
    async getMenuItemById(
      @Param('restaurantId') restaurantId: string,
      @Param('itemId') itemId: string,
    ) {
      return this.restaurantService.getItemById(restaurantId, itemId);
    }
  
    @Get(':restaurantId/menu')
    @ApiOperation({ summary: 'Get all menu items' })
    async getMenuItems(@Param('restaurantId') restaurantId: string) {
      return this.restaurantService.getMenuItems(restaurantId);
    }
  
    @Get('coupons/:restaurantId')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get coupons by restaurant ID' })
    async getCoupons(@Param('restaurantId') restaurantId: string) {
      return this.restaurantService.getCoupons(restaurantId);
    }
  
    @Post('coupons/:restaurantId')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create coupon' })
    async createCoupon(
      @Param('restaurantId') restaurantId: string,
      @Body() dto: CouponDto,
    ) {
      return this.restaurantService.createCoupon(restaurantId, dto);
    }
  
    @Put('coupons/:couponId')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Update coupon' })
    async updateCoupon(
      @Param('couponId') couponId: string,
      @Body() dto: UpdateCoponDto,
    ) {
      return this.restaurantService.updateCoupon(couponId, dto);
    }
  
    @Get('search/food')
    @Roles(Role.USER)
    @ApiOperation({ summary: 'Search by food name' })
    @ApiQuery({ name: 'q', required: true })
    async searchByFood(@Query('q') query: string) {
      return this.restaurantService.searchRestaurantsByFood(query);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get restaurant by ID' })
    async getRestaurantById(@Param('id') id: string) {
      return this.restaurantService.getRestaurantById(id);
    }
  }
  