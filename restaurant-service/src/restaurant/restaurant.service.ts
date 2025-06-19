import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
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
import { Manager } from 'src/manager/schema/manager.schema';
import { MESSAGES } from './constants/restaurant-constant';
import { throwBadRequest, throwInternal, throwNotFound } from './common/http-exception.utils';
import { UpdateMenuItemDto } from './dto/updateMenuItem.dto';
import { types } from 'util';
import { Type } from 'class-transformer';

interface MediaService {
  getSignedUrl(key: string): Promise<string>;
}

@Injectable()
export class RestaurantService implements OnModuleInit {
  private mediaService: MediaService;

  constructor(
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    @InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    private readonly configService: ConfigService,
    private readonly redisSerice: RedisService,
    private readonly logger: WinstonLogger,
  ) { }

  // Lifecycle hook to initialize mediaService via gRPC (if applicable)
  onModuleInit() {
    this.mediaService;
  }

  // Get restaurant by ID
  async getRestaurantById(id: string) {
    this.logger.log(`Fetching restaurant with ID: ${id}`);
    const restaurant = await this.restaurantModel.findById(id).exec();
    if (!restaurant) {
      throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(id));
    }
    return restaurant;
  }


  // Create a restaurant and assign it to a verified manager
  async createRestaurant(createRestaurantDto: CreateRestaurantDto, managerId: string) {
    const manager = await this.managerModel.findOne({ _id: new Types.ObjectId(managerId) });
    console.log(manager);
    if (!manager) {
      throwNotFound(MESSAGES.MANAGER_NOT_FOUND);
    }
    if (!manager.isActiveManager) {
      console.log(manager.isActiveManager)
      throwBadRequest(MESSAGES.MANAGER_NOT_VERIFIED);
    }

    const alreadyVerified = await this.restaurantModel.findOne({ managerId, isActiveManager: true });

    if (alreadyVerified) {
      throwBadRequest(MESSAGES.MANAGER_ALREADY_VERIFIED);
    }

    try {
      const newRestaurant = new this.restaurantModel({ ...createRestaurantDto, managerId });
      this.logger.log(`Creating restaurant for manager ${managerId}`);
      return await newRestaurant.save();
    } catch (error) {
      this.logger.error(`Error creating restaurant: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Update a restaurant by its ID
  async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
    this.logger.log(`Updating restaurant with ID: ${id}`);
    try {
      const updated = await this.restaurantModel.findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      }).exec();

      if (!updated) {
        this.logger.warn(`Restaurant with ID ${id} not found`);
        throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(id));
      }

      return updated;
    } catch (error) {
      this.logger.error(`Error updating restaurant: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Get all restaurants managed by a specific manager
  async getRestaurantByManagerId(managerId: string) {
    this.logger.log(`Fetching restaurants for manager ID: ${managerId}`);
    return await this.restaurantModel.findOne({ managerId }).exec();
  }

  // Get nearby restaurants based on user location, also caches the coordinates in Redis
  async getNearbyRestaurants(latitude: number, longitude: number, user: any, limit = 10, offset = 0) {
    const userId = user?.userId;
    const redisKey = `address:${userId}:coordinates`;
    const value = JSON.stringify({ latitude, longitude });

    this.logger.log(`Setting location cache for user ${userId}`);
    await this.redisSerice.setData(redisKey, value, 5 * 60 * 1000); // Cache for 5 minutes

    this.logger.log(`Querying nearby restaurants for location [${latitude}, ${longitude}]`);
    try {
      const results = await this.restaurantModel.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: 10000, // 10 km radius
          },
        },
      }).skip(offset).limit(limit).exec();

      if (!results.length) {
        throwNotFound(MESSAGES.NO_RESTAURANTS_FOUND_NEARBY);
      }

      return results;
    } catch (error) {
      this.logger.error(`Error fetching nearby restaurants: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Get all restaurants with pagination
  async getAllRestaurants(limit = 10, offset = 0) {
    this.logger.log(`Fetching all restaurants with limit: ${limit}, offset: ${offset}`);
    return this.restaurantModel.find().skip(offset).limit(limit).exec();
  }

  // Find restaurants matching one or more tags
  async findByTags(tags: string[]) {
    this.logger.log(`Finding restaurants with tags: ${tags.join(', ')}`);
    return await this.restaurantModel.find({ tags: { $in: tags } }, { _id: 0 }).exec();
  }

  // Create a new menu item under a restaurant
  async createMenuItem(createMenuItemDto: CreateMenuItemDto, managerId: string) {
    try {
      this.logger.log(`Creating menu item by manager ID: ${managerId}`);
      const restaurant = await this.restaurantModel.findOne({ managerId }, { _id: 1 }).exec();
      if (!restaurant) {
        throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(restaurant))
      }
      const restaurantId = restaurant._id
      if (!restaurantId) {
        throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(restaurantId));
      }

      const newMenuItem = new this.menuItemModel({
        ...createMenuItemDto,
        restaurantId: restaurantId.toString(),
      });
      return await newMenuItem.save();
    } catch (error) {
      this.logger.error(`Error creating menu item: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }


  async updateMenuItem(itemId: string, updateMenuItemDto: UpdateMenuItemDto) {
    try {
      console.log(updateMenuItemDto);

      const item = await this.menuItemModel.findByIdAndUpdate(
        { _id: new Types.ObjectId(itemId) },
        updateMenuItemDto,
        { new: true }
      );

      if (!item) {
        throwNotFound(MESSAGES.ITEM_NOT_FOUND);
      }
      console.log(item);
      return item;
    } catch (error) {
      this.logger.error(`Error updating menu item with ID ${itemId}: ${error.message}`, error.stack);

      if (error.name === 'CastError') {
        throwNotFound(MESSAGES.ITEM_NOT_FOUND);
      } else if (error.name === 'ValidationError') {
        throwBadRequest(MESSAGES.VALIDATION_FAILED(error.message));
      } else {
        throwInternal(MESSAGES.UNKNOWN_ERROR);
      }
    }
  }

  /**
   * 
   * @param itemId 
   * @returns 
   */
  async deleteItem(itemId: string) {
    try {
      const item = await this.menuItemModel.findByIdAndDelete(new Types.ObjectId(itemId));

      if (!item) {
        this.logger.warn(`Menu item with ID ${itemId} not found for deletion.`);
        throwNotFound(MESSAGES.ITEM_NOT_FOUND);
      }
      this.logger.log(`Successfully deleted menu item: ${JSON.stringify(item)}`);
      return item;
    }catch(error){
      this.logger.error(`Error deleting menu item with ID ${itemId}: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Get a specific menu item by restaurant ID and item ID
  async getItemById(restaurantId: string, itemId: string) {
    this.logger.log(`Fetching menu item ID: ${itemId} for restaurant: ${restaurantId}`);
    const item = await this.menuItemModel.findOne({ _id: itemId, restaurantId }).exec();
    if (!item) {
      throwNotFound(MESSAGES.MENU_ITEM_NOT_FOUND(itemId));
    }
    return item;
  }

  // Get all menu items for a restaurant
  async getMenuItems(restaurantId: string) {
    this.logger.log(`Fetching menu items for restaurant ID: ${restaurantId}`);
    const restaurant = await this.restaurantModel.findById(new Types.ObjectId(restaurantId)).exec();
    if (!restaurant) {
      throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(restaurantId));
    }

    return await this.menuItemModel.find({ restaurantId }).exec();
  }


  // Get list of coupon attached to a restaurant
  async getCoupons(restaurantId: string) {
    this.logger.log(`Fetching coupons for restaurant ID: ${restaurantId}`);
    const coupons = await this.couponModel.find({ restaurantId: new Types.ObjectId(restaurantId) }).exec();
    if (!coupons) {
      throwNotFound(MESSAGES.COUPON_NOT_FOUND);
    }
    return coupons;
  }

  // Create a coupon for a specific restaurant
  async createCoupon(restaurantId: string, couponData: CouponDto) {
    this.logger.log(`Creating coupon for restaurant ID: ${restaurantId}`);
    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throwNotFound(MESSAGES.RESTAURANT_NOT_FOUND(restaurantId));
    }

    try {
      const newCoupon = new this.couponModel({ ...couponData, restaurantId });
      return await newCoupon.save();
    } catch (error) {
      this.logger.error(`Error creating coupon: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Update coupon by its ID
  async updateCoupon(couponId: string, couponData: UpdateCoponDto) {
    this.logger.log(`Updating coupon ID: ${couponId}`);
    try {
      const updated = await this.couponModel.findByIdAndUpdate(couponId, couponData, {
        new: true,
        runValidators: true,
      }).exec();

      if (!updated) {
        throwNotFound(MESSAGES.COUPON_NOT_FOUND);
      }

      return updated;
    } catch (error) {
      this.logger.error(`Error updating coupon: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Search restaurants based on food keywords in menu items
  async searchRestaurantsByFood(query: string) {
    this.logger.log(`Searching restaurants by food keyword: "${query}"`);
    try {
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
      if (!restaurantIds.length) {
        throwNotFound(MESSAGES.NO_RESTAURANTS_FOUND_FOR_QUERY(query));
      }

      return await this.restaurantModel.find({ _id: { $in: restaurantIds } }).exec();
    } catch (error) {
      this.logger.error(`Error searching restaurants: ${error.message}`, error.stack);
      throwInternal(MESSAGES.UNKNOWN_ERROR);
    }
  }

}
