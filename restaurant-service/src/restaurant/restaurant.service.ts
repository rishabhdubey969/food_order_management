import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MenuItem } from './schema/menuItem.schema';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { Coupon } from './schema/copon.schema';
import { CouponDto } from './dto/coupon.dto';
import { UpdateCoponDto } from './dto/updateCoupon.dto';

@Injectable()
export class RestaurantService {

    constructor(
        @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
        @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
        @InjectModel('Coupon') private readonly couponModel: Model<Coupon>, 
    ) {}

    getRestaurantById(id: string){
        return this.restaurantModel.findById(id).exec();
    }

    createRestaurant(createRestaurantDto: CreateRestaurantDto, managerId: string) {
        const newRestaurant = new this.restaurantModel({
          ...createRestaurantDto,
          managerId
        });
        return newRestaurant.save();
    }

    async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
      const updated = await this.restaurantModel.findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      }).exec();
    
      if (!updated) {
        throw new NotFoundException(`Restaurant with ID ${id} not found`);
      }
      return updated;
    }
    

    getRestaurantByManagerId(managerId: string) {
        return this.restaurantModel.find({ managerId }).exec();
    }

    async getNearbyRestaurants(latitude: number, longitude: number, limit: number = 10, offset: number = 0) {
        return await this.restaurantModel.find({
            location: {
              $nearSphere: {
                $geometry: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                $maxDistance: 10000,
              },
            },
          })
          .skip(offset)
          .limit(limit);
    }

    getAllRestaurants(limit: number = 10, offset: number = 0) {
      return this.restaurantModel.find().skip(offset).limit(limit).exec();
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

    getCoupons(restaurantId: string) {
      return this.restaurantModel.findById(restaurantId, { copons: 1 }).exec();
    }

    createCoupon(restaurantId: string, couponData: CouponDto) {
      const newCoupon = new this.couponModel({
        ...couponData,
        restaurantId: restaurantId,
      })
      return newCoupon.save();
    }

    async updateCoupon(couponId: string, couponData: UpdateCoponDto) {
      return await this.couponModel.findByIdAndUpdate(couponId, couponData, {
        new: true,
        runValidators: true,
      }).exec();
    }

  async searchRestaurantsByFood(query: string, limit: number, offset: number) {
  const results = await this.menuItemModel.aggregate([
    {
      $search: {
        index: 'default', 
        text: {
          query: query,
          path: ['name', 'tags'],
          fuzzy: {} 
        }
      }
    },
    {
      $group: {
        _id: '$restaurantId'
      }
    },
    {
      $skip: offset
    },
    {
      $limit: limit
    }
  ]);

  const restaurantIds = results.map(r => r._id);

  return this.restaurantModel.find({ _id: { $in: restaurantIds } });
}

 
}