import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId, Db, Collection } from 'mongodb';
import Redis from 'ioredis';
import { InjectConnection } from '@nestjs/mongoose';
import { EventPattern } from '@nestjs/microservices';

import { WinstonLogger } from '../logger/winston-logger.service';
import { CartConstants } from './constant/cart.constants';
import { AddCartDto } from './dto/addCart.dto';
import { RemoveItemDto } from './dto/removeItem.dto';
import { ResponseMessages } from './constant/response.message';

@Injectable()
export class CartService {
  private readonly carts: Collection;
  private readonly restaurants: Collection;
  private readonly menuItems: Collection;
  private readonly coupons: Collection;

  constructor(
    @InjectConnection() private readonly db: any,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly logger: WinstonLogger,
  ) {
    const database: Db = this.db.db;
    this.carts = database.collection('carts');
    this.restaurants = database.collection('restaurants');
    this.menuItems = database.collection('menuitems');
    this.coupons = database.collection('coupons');
  }

//adding to cart service
  async addToCartService(userId: string, dto: AddCartDto) {
    try {
      this.logger.log(`Adding item ${dto.itemId} for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);
  
      // Fetch cart
      let cart = await this.carts.findOne({ userId: userObjId });
  
      // Fetch restaurant
      const restaurant = await this.restaurants.findOne({ _id: new ObjectId(dto.restaurantId) });
      if (!restaurant) throw new NotFoundException('Restaurant not found');
  
      // Fetch menu item
      const menuItem = await this.menuItems.findOne({ _id: new ObjectId(dto.itemId) });
      if (!menuItem) throw new NotFoundException('Item not found');
      if (!menuItem.isAvailable) throw new ConflictException('Item is unavailable');
  
      // Check for restaurant conflict
      if (cart && cart.restaurantId.toString() !== dto.restaurantId)
        throw new ConflictException('You already have a cart for another restaurant');
  
      // Calculate distance and delivery charges
      const { latitude = CartConstants.DEFAULT_LAT, longitude = CartConstants.DEFAULT_LON } =
        JSON.parse(await this.redisClient.get(`address:${userId}:coordinates`) ?? '{}');
      const [restLon, restLat] = restaurant.location.coordinates;
      const distance = this.calculateDistance(latitude, longitude, restLat, restLon);
      const deliveryCharges = this.calculateDeliveryCharges(distance);
  
      // Update items in the cart
      let items = cart ? cart.items : [];
      const idx = items.findIndex(i => i.itemId.toString() === dto.itemId);
  
      if (idx >= 0) {
        items[idx].quantity += 1;
        items[idx].tax = this.calculateTax(items[idx].price * items[idx].quantity);
      } else {
        items.push({
          itemId: new ObjectId(dto.itemId),
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
          tax: this.calculateTax(menuItem.price),
        });
      }
  
      // Calculate totals
      const totals = this.calculateCartTotals(items, deliveryCharges);
      const changes = {
        $set: {
          userId: userObjId,
          restaurantId: new ObjectId(dto.restaurantId),
          items,
          deliveryCharges,
          distanceInKm: parseFloat(distance.toFixed(2)),
          discount: 0,
          couponCode: null,
          couponId: null,
          ...totals,
        },
      };
  
      this.logger.debug(`Query: ${JSON.stringify({ userId: userObjId })}`, CartService.name);
      this.logger.debug(`Changes: ${JSON.stringify(changes)}`, CartService.name);
  
      // Update the cart
      const updated = await this.carts.findOneAndUpdate(
        { userId: userObjId },
        changes,
        { upsert: true, returnDocument: 'after' },
      );
  
      // Handle case where updated cart is not returned
      if (!updated || !updated.value) {
        this.logger.warn(`Cart not returned after update for user ${userId}. Fetching manually.`, CartService.name);
        cart = await this.carts.findOne({ userId: userObjId });
        if (!cart) {
          this.logger.error(`Failed to fetch cart for user ${userId} after update`, CartService.name);
          throw new InternalServerErrorException('Failed to fetch updated cart');
        }
        return cart;
      }
  
      return updated.value;
    } catch (error) {
      this.logger.error(`Error in addToCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }


  async removeItemService(userId: string, dto: RemoveItemDto) {
    try {
      this.logger.log(`Removing item ${dto.itemId} for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);
  
      // Fetch the cart
      const cart = await this.carts.findOne({ userId: userObjId });
      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_NOT_FOUND);
  
      // Find the item in the cart
      const idx = cart.items.findIndex(i => i.itemId.toString() === dto.itemId);
      if (idx === -1) throw new NotFoundException(ResponseMessages.CART.ITEM_NOT_FOUND);
  
      const items = cart.items;
      const item = items[idx];
      item.quantity -= 1;
  
      // Remove the item if quantity is zero
      if (item.quantity <= 0) {
        items.splice(idx, 1);
      } else {
        item.tax = this.calculateTax(item.price * item.quantity);
      }
  
      // Delete the cart if no items are left
      if (items.length === 0) {
        await this.carts.deleteOne({ _id: cart._id });
        this.logger.warn(`Cart emptied and deleted for user ${userId}`, CartService.name);
        return { message: 'Cart deleted because no items left' };
      }
  
      // Calculate totals
      const totals = this.calculateCartTotals(items, cart.deliveryCharges, cart.discount || 0);
  
      // Update the cart
      const updated = await this.carts.findOneAndUpdate(
        { userId: userObjId },
        { $set: { items, ...totals } },
        { returnDocument: 'after' },
      );
  
      // Handle case where updated cart is not returned
      if (!updated || !updated.value) {
        this.logger.warn(`Cart not returned after update for user ${userId}. Fetching manually.`, CartService.name);
        const updatedCart = await this.carts.findOne({ userId: userObjId });
        if (!updatedCart) {
          this.logger.error(`Failed to fetch cart for user ${userId} after update`, CartService.name);
          throw new InternalServerErrorException('Failed to fetch updated cart');
        }
        return updatedCart;
      }
  
      return updated.value;
    } catch (error) {
      this.logger.error(`Error in removeItemService: ${error.message}`, CartService.name);
      throw error;
    }
  }


  // Get user’s cart
  async getCartService(userId: string) {
    try {
      this.logger.verbose(`Fetching cart for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);
      const cart = await this.carts.findOne({ userId: userObjId });
      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_FETCH_FAIL);

      return cart;
    } catch (error) {
      this.logger.error(`Error in getCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }


  //applying coupon on user's cart
  async applyCouponService(userId: string, couponId: string) {
    try {
      this.logger.log(`Applying coupon ${couponId} to user ${userId}`, CartService.name);
  
      const userObjId = new ObjectId(userId);
      const cart = await this.carts.findOne({ userId: userObjId });
  
      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_NOT_FOUND);
  
      // Check if a coupon is already applied
      if (cart.couponId) {
        throw new BadRequestException('A coupon has already been applied to this cart.');
      }
  
      const coupon = await this.coupons.findOne({ _id: new ObjectId(couponId) });
      if (!coupon) throw new NotFoundException(ResponseMessages.COUPON.COUPON_NOT_FOUND);
  
      if (coupon.restaurantId && coupon.restaurantId.toString() !== cart.restaurantId.toString()) {
        throw new BadRequestException(ResponseMessages.COUPON.INVALID_COUPON);
      }
  
      if (!coupon.isActive || coupon.expiryDate < new Date()) {
        throw new BadRequestException(ResponseMessages.COUPON.COUPON_EXPIRED);
      }
  
      if (cart.total < coupon.minOrderAmount) {
        throw new BadRequestException(
          ResponseMessages.COUPON.COUPON_MIN_AMOUNT(coupon.minOrderAmount),
        );
      }
  
      const percentageDiscount = (cart.total * coupon.discountPercent) / 100;
      const discount = Math.min(percentageDiscount, coupon.maxDiscount);
      const newTotal = Math.round(cart.total - discount);
  
      await this.carts.updateOne(
        { _id: cart._id },
        {
          $set: {
            total: newTotal,
            discount,
            couponCode: coupon.code,
            couponId: coupon._id,
          },
        },
      );
  
      this.logger.log(`Coupon applied for user ${userId}`, CartService.name);
  
      return {
        message: 'Coupon applied successfully',
        newTotal,
        discountApplied: discount,
        couponCode: coupon.code,
      };
    } catch (error) {
      this.logger.error(`Error in applyCouponService: ${error.message}`, CartService.name);
      throw error;
    }
  }
  


  //viewing coupon
  async viewCouponsService(restaurantId: string) {
    try {
      this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`, CartService.name);
      const coupons = await this.coupons
        .find({ restaurantId: new ObjectId(restaurantId) })
        .toArray();
        console.log(coupons)

      if (!coupons.length) throw new NotFoundException(ResponseMessages.COUPON.NO_COUPONS);

      return coupons;
    } catch (error) {
      this.logger.error(`Error in viewCouponsService: ${error.message}`, CartService.name);
      throw error;
    }
  }


//deleting cart
  @EventPattern('orderCreated')
  async deleteCartService(userId: string) {
    try {
      this.logger.warn(`Deleting cart for user ${userId}`, CartService.name);
      const result = await this.carts.deleteOne({ userId: new ObjectId(userId) });
      if (result.deletedCount === 0) {
        this.logger.warn(`No cart found to delete for user ${userId}`, CartService.name);
      } else {
        this.logger.log(`Cart deleted for user ${userId}`, CartService.name);
      }
    } catch (error) {
      this.logger.error(`Error in deleteCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }



  //removing coupon from the cart
  async removeCouponService(userId: string) {
    try {
      this.logger.log(`Removing coupon for user ${userId}`, CartService.name);
  
      const userObjId = new ObjectId(userId);
      const cart = await this.carts.findOne({ userId: userObjId });
  
      if (!cart) {
        throw new NotFoundException(ResponseMessages.CART.CART_NOT_FOUND);
      }
  
      if (!cart.couponId) {
        throw new BadRequestException('No coupon is currently applied to the cart.');
      }
  
      // Restore original total
      const originalTotal = cart.total + cart.discount;
  
      await this.carts.updateOne(
        { _id: cart._id },
        {
          $set: {
            total: originalTotal,
            discount: 0,
            couponId: null,
            couponCode: null,
          },
        },
      );
  
      this.logger.log(`Coupon removed from cart for user ${userId}`, CartService.name);
  
      return {
        message: 'Coupon removed successfully',
        newTotal: originalTotal,
        discountRemoved: cart.discount,
      };
    } catch (error) {
      this.logger.error(`Error in removeCouponService: ${error.message}`, CartService.name);
      throw error;
    }
  }
  




  // -----------------------
  // 🧠 Helper Methods Below
  // -----------------------

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateDeliveryCharges(distance: number): number {
    return Math.ceil(distance * CartConstants.DELIVERY_CHARGE_PER_KM);
  }

  private calculateTax(amount: number): number {
    return (amount * CartConstants.TAX_PERCENT) / 100;
  }

  private calculateCartTotals(
    items: {
      price: number;
      quantity: number;
    }[],
    deliveryCharges: number,
    discount = 0,
  ) {
    const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = this.calculateTax(itemTotal);
    const total = Math.round(itemTotal + tax + deliveryCharges + CartConstants.PLATFORM_FEE - discount);

    return {
      itemTotal,
      subtotal: itemTotal,
      tax,
      total,
      platformFee: CartConstants.PLATFORM_FEE,
    };
  }

  private findItemIndex(items: any[], itemId: string): number {
    return items.findIndex(i => String(i.itemId) === itemId);
  }
}

