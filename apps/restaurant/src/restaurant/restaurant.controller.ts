import { Body, Controller, Post } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/restaurant.dto';

@Controller('restaurant')
export class RestaurantController {
    
    constructor(private readonly restaurantService: RestaurantService) {}

    @Post('create')
    async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
        return this.restaurantService.createRestaurant(createRestaurantDto);
    }
}
