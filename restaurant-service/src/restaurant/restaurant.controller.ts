import { Body, Controller, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';
import { RolesGuard } from './guards/roles.guard';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { AdminGuard } from './guards/admin.guard';
import {
    ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery,
    ApiResponse, ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import {  CouponDto } from './dto/coupon.dto';
import { UpdateCoponDto } from './dto/updateCoupon.dto';

interface MediaService {
    getSignedUrl(fileName: string, fileType: string, folderName: string): Promise<string>;
}

@ApiTags('Restaurants')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('restaurant')
export class RestaurantController {

    private mediaService: MediaService;

    constructor(private readonly restaurantService: RestaurantService) { }

    @Post('create/:managerId')
    @ApiOperation({ summary: 'Create a restaurant' })
    @ApiResponse({ status: 201, description: 'Restaurant created successfully.' })
    async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto, @Param('managerId') managerId: string) {
        return this.restaurantService.createRestaurant(createRestaurantDto, managerId);
    }

    @Get('/nearby')
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
    ) {
        return this.restaurantService.getNearbyRestaurants(latitude, longitude, +limit, +offset);
    }

    @UseGuards(AdminGuard)
    @Get('/all')
    @ApiOperation({ summary: 'Get all restaurants (Admin only)' })
    async getAllRestaurants(@Query('limit') limit = 10, @Query('offset') offset = 0) {
        return this.restaurantService.getAllRestaurants(+limit, +offset);
    }

    @Put('/:id')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Update a restaurant' })
    async updateRestaurant(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
        return this.restaurantService.updateRestaurant(id, updateRestaurantDto);
    }

    @Get('/manager/:managerId')
    @ApiOperation({ summary: 'Get restaurant by manager ID' })
    async getRestaurantByManagerId(@Param('managerId') managerId: string) {
        return this.restaurantService.getRestaurantByManagerId(managerId);
    }

    @UseGuards(AdminGuard)
    @Get()
    @ApiOperation({ summary: 'Get restaurants by tags (Admin only)' })
    @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated list of tags' })
    async getRestaurants(@Query('tags') tags?: string) {
        const tagArray = tags ? tags.split(',') : [];
        return this.restaurantService.findByTags(tagArray);
    }

    @Post('signed-url')
    getSignedUrlForRestaurant(@Body() body: { fileName: string; fileType: string }) {
        const { fileName, fileType } = body;
        const signedUrl = this.mediaService.getSignedUrl(fileName, fileType, 'restaurant');
        return { signedUrl };
    }

    @Post('menu/signed-url')
    getSignedUrlForMenuItem(@Body() body: { fileName: string; fileType: string }){
        const { fileName, fileType } = body;
        const signedUrl = this.mediaService.getSignedUrl(fileName, fileType, 'menu');
        return { signedUrl };
    }

    // @UseGuards(RolesGuard)
    @Post('/:restaurantId/menu')
    @ApiOperation({ summary: 'Create a menu item for a restaurant' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateMenuItemDto })
    async createMenu(
        @Param('restaurantId') restaurantId: string,
        @Body() createMenuItemDto: CreateMenuItemDto,
    ) {
        return this.restaurantService.createMenuItem(restaurantId, createMenuItemDto);
    }

    @Get('/:restaurantId/menu/:itemId')
    @ApiOperation({ summary: 'Get menu item by ID' })
    async getItemById(
        @Param('restaurantId') restaurantId: string,
        @Param('itemId') itemId: string,
    ) {
        return this.restaurantService.getItemById(restaurantId, itemId);
    }

    @Get('/:restaurantId/menu')
    @ApiOperation({ summary: 'Get all menu items by restaurant ID' })
    async getMenuItems(@Param('restaurantId') restaurantId: string) {
        return this.restaurantService.getMenuItems(restaurantId);
    }

    @Get('/coupons/:restaurantId')
    @ApiOperation({ summary: 'Get coupons by restaurant ID' })
    async getCoupons(@Param('restaurantId') restaurantId: string) {
        return this.restaurantService.getCoupons(restaurantId);
    }

    @Post('/coupons/:restaurantId')
    // @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Create a coupon for a restaurant' })
    async createCoupon(
        @Param('restaurantId') restaurantId: string,
        @Body() createCouponDto: CouponDto
    ) {
        return this.restaurantService.createCoupon(restaurantId, createCouponDto);
    }

    @Put('/coupons/:couponId')
    // @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Update a coupon for a restaurant' })
    async updateCoupon(
        @Param('couponId') couponId: string,
        @Body() updateCouponDto: UpdateCoponDto
    ) {
        return this.restaurantService.updateCoupon(couponId, updateCouponDto);
    }

    @Get('/search/food')
    @ApiOperation({ summary: 'Search restaurants by food keyword' })
    @ApiQuery({ name: 'q', required: true, description: 'Search query string' })
    async searchByFood(@Query('q') query: string) {
        return this.restaurantService.searchRestaurantsByFood(query);
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Get restaurant by ID' })
    async getRestaurantById(@Param('id') id: string) {
        return this.restaurantService.getRestaurantById(id);
    }
}
