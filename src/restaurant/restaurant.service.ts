import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MenuItem } from './schema/menuItem.schema';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';

@Injectable()
export class RestaurantService {

    constructor(
        @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
        @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    ) {}

    getRestaurantById(id: string){
        return this.restaurantModel.findById(id).exec();
    }

    createRestaurant(createRestaurantDto: CreateRestaurantDto){
        const newRestaurant = new this.restaurantModel(createRestaurantDto);
        return newRestaurant.save();
    }

    updateRestaurant(id: string, createRestaurantDto: CreateRestaurantDto){
        return this.restaurantModel.findByIdAndUpdate(id, createRestaurantDto, { new: true }).exec();
    }

    getRestaurantByManagerId(managerId: string) {
        return this.restaurantModel.find({ managerId }).exec();
    }

    getNearbyRestaurants(latitude: number, longitude: number) {
        return this.restaurantModel.find({
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: [latitude, longitude] },
                $maxDistance: 5000,
              },
            },
        });
    }

    getAllRestaurants(){
        return this.restaurantModel.find();
    }

    findByTags(tags: string[]) {
        return this.restaurantModel.find({ tags: { $in: tags } }, {_id: 0}).exec();
    }

    createMenuItem(restaurantId: string, createMenuItemDto: CreateMenuItemDto) {
        const newMenuItem = new this.menuItemModel({
            ...createMenuItemDto,
            restaurantId: restaurantId,
        });
        return newMenuItem.save();
    }

    getItemById(restaurantId: string, itemId: string) {
        return this.menuItemModel.findOne({ _id: itemId, restaurantId }).exec();
    }

    getMenuItems(restaurantId: string){
        return this.menuItemModel.find({ restaurantId }).exec();
    }

    getCopons(restaurantId: string) {
        return this.restaurantModel.findById(restaurantId, { copons: 1 }).exec();
    }
}
