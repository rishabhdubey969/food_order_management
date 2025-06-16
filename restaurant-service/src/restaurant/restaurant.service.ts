import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/restaurant.dto';
import { MenuItem } from './schema/menuItem.schema';
import { CreateMenuItemDto } from './dto/createMenuItem.dto';
import { UpdateRestaurantDto } from './dto/updateRestaurant.dto';
import { Coupon } from './schema/copon.schema';
import { CouponDto } from './dto/coupon.dto';
import { UpdateCoponDto } from './dto/updateCoupon.dto';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { WinstonLogger } from 'src/logger/winston-logger.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    @InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
    private readonly configService: ConfigService,
    private readonly redisSerice: RedisService,
    private readonly logger: WinstonLogger,
  ) {}

  async getRestaurantById(id: string) {
    this.logger.log(`Fetching restaurant with ID: ${id}`);
    return this.restaurantModel.findById(id).exec();
  }

  async createRestaurant(createRestaurantDto: CreateRestaurantDto, managerId: string) {
    const newRestaurant = new this.restaurantModel({ ...createRestaurantDto, managerId });
    this.logger.log(`Creating restaurant for manager ${managerId}`);
    return newRestaurant.save();
  }

  async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
    this.logger.log(`Updating restaurant with ID: ${id}`);
    const updated = await this.restaurantModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    }).exec();

    if (!updated) {
      this.logger.warn(`Restaurant with ID ${id} not found`);
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return updated;
  }

  async getRestaurantByManagerId(managerId: string) {
    this.logger.log(`Fetching restaurants for manager ID: ${managerId}`);
    return this.restaurantModel.find({ managerId }).exec();
  }

  async getNearbyRestaurants(latitude: number, longitude: number, limit = 10, offset = 0, user: any) {
    const userId = user?.userId;
    const redisKey = `address:${userId}:coordinates`;
    const value = JSON.stringify({ latitude, longitude });

    this.logger.log(`Setting location cache for user ${userId}`);
    await this.redisSerice.setData(redisKey, value, 5 * 60 * 1000);

    this.logger.log(`Querying nearby restaurants for location [${latitude}, ${longitude}]`);
    return this.restaurantModel.find({
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

  async getAllRestaurants(limit = 10, offset = 0) {
    this.logger.log(`Fetching all restaurants with limit: ${limit}, offset: ${offset}`);
    return this.restaurantModel.find().skip(offset).limit(limit).exec();
  }

  async findByTags(tags: string[]) {
    this.logger.log(`Finding restaurants with tags: ${tags.join(', ')}`);
    return this.restaurantModel.find({ tags: { $in: tags } }, { _id: 0 }).exec();
  }

  async createMenuItem(restaurantId: string, createMenuItemDto: CreateMenuItemDto) {
    this.logger.log(`Creating menu item for restaurant ID: ${restaurantId}`);
    const newMenuItem = new this.menuItemModel({
      ...createMenuItemDto,
      restaurantId,
    });
    return newMenuItem.save();
  }

  async getItemById(restaurantId: string, itemId: string) {
    this.logger.log(`Fetching menu item ID: ${itemId} for restaurant: ${restaurantId}`);
    return this.menuItemModel.findOne({ _id: itemId, restaurantId }).exec();
  }

  async getMenuItems(restaurantId: string) {
    this.logger.log(`Fetching menu items for restaurant ID: ${restaurantId}`);
    return this.menuItemModel.find({ restaurantId }).exec();
  }

  async getCoupons(restaurantId: string) {
    this.logger.log(`Fetching coupons for restaurant ID: ${restaurantId}`);
    return this.restaurantModel.findById(restaurantId, { copons: 1 }).exec();
  }

  async createCoupon(restaurantId: string, couponData: CouponDto) {
    this.logger.log(`Creating coupon for restaurant ID: ${restaurantId}`);
    const newCoupon = new this.couponModel({ ...couponData, restaurantId });
    return newCoupon.save();
  }

  async updateCoupon(couponId: string, couponData: UpdateCoponDto) {
    this.logger.log(`Updating coupon ID: ${couponId}`);
    return this.couponModel.findByIdAndUpdate(couponId, couponData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async searchRestaurantsByFood(query: string) {
    this.logger.log(`Searching restaurants by food keyword: "${query}"`);
    const results = await this.menuItemModel.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { tags: { $elemMatch: { $regex: query, $options: 'i' } } },
          ],
        },
      },
      {
        $group: {
          _id: '$restaurantId',
        },
      },
    ]);

    const restaurantIds = results.map((r) => r._id);
    return this.restaurantModel.find({ _id: { $in: restaurantIds } }).exec();
  }
}
