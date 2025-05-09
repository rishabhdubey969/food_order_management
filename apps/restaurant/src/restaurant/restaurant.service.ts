import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class RestaurantService {

    constructor(@InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>) {}

    getAllRestaurants(){
        return this.restaurantModel.find().exec();
    }

    getRestaurantById(id: string){
        return this.restaurantModel.findById(id).exec();
    }

    createRestaurant(createRestaurantDto: CreateRestaurantDto){
        const newRestaurant = new this.restaurantModel(createRestaurantDto);
        return newRestaurant.save();
    }
}
