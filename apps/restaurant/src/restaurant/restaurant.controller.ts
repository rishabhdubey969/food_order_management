import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';

@Controller('restaurant')
export class RestaurantController {

    constructor(
        private readonly restaurantService: RestaurantService,
    ) { }

    //Create Restaurant
    @Post()
    async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
        return this.restaurantService.createRestaurant(createRestaurantDto);
    }

    //Get Restaurant by ID
    @Get('/:id')
    getRestaurantById(@Param("id") id: string) {
        return this.restaurantService.getRestaurantById(id);
    }

    //Update Restaurant by ID
    @Put('/:id')
    async updateRestaurant(@Param('id') id: string, @Body() createRestaurantDto: CreateRestaurantDto) {
        return this.restaurantService.updateRestaurant(id, createRestaurantDto);
    }

    //Get Restaurant by Manager ID
    @Get('/manager/:managerId')
    async getRestaurantByManagerId(@Param('managerId') managerId: string) {
        return await this.restaurantService.getRestaurantByManagerId(managerId);
    }

    //Get Nearby Restaurants
    @Get('/nearby')
    async getNearbyRestaurants(@Param('latitude') latitude: number, @Param('longitude') longitude: number) {
        return await this.restaurantService.getNearbyRestaurants(latitude, longitude);
    }

    //Get All Restaurants
    @Get('/all')
    async getAllRestaurants() {
        return await this.restaurantService.getAllRestaurants();
    }

    //Get Restaurants by Tags
    @Get()
    async getRestaurants(@Query('tags') tags?: string) {
        const tagArray = tags ? tags.split(',') : [];
        return await this.restaurantService.findByTags(tagArray);
    }

    //Get Menu Items by Restaurant ID
    @Post('/:restaurantId/menu')
    async createMenu(@Param('restaurantId') restaurantId: string, @Body() createMenuItemDto: CreateMenuItemDto) {
        return await this.restaurantService.createMenuItem(restaurantId, createMenuItemDto);
    }

    //Get Menu Item by ID
    @Get('/:restaurantId/menu/:itemId')
    async getItemById(
        @Param('restaurantId') restaurantId: string,
        @Param('itemId') itemId: string,
    ) {
        return await this.restaurantService.getItemById(restaurantId, itemId);
    }

    //Get Menu Items by Restaurant ID
    @Get('/:restaurantId/menu')
    async getMenuItems(@Param('restaurantId') restaurantId: string) {
        return await this.restaurantService.getMenuItems(restaurantId);
    }

    @Get('/copons/:restaurantId')
    async getCopons(@Param('restaurantId') restaurantId: string) {
        return await this.restaurantService.getCopons(restaurantId);
    }   
}
