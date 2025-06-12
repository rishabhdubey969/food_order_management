import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Address, AddressDocument } from './schema/address.schema';
import { Coupon, CouponDocument } from './schema/coupon.schema';
import { Restaurant } from './schema/restaurant.schema';
import Redis from 'ioredis';
import { MenuItem } from './schema/menu-item.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel('Coupons') private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel("MenuItem") private readonly menuItemModel: Model<MenuItem>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calculateDeliveryCharges(distance: number): number {
    return Math.ceil(distance) * 5;
  }

  async removeItemService(cartId: string, itemId: string) {
    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
  
    const itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }
  
    const taxPercent = 5;
  
    const item = cart.items[itemIndex];
    item.quantity -= 1;
  
    if (item.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      item.tax = (item.price * item.quantity * taxPercent) / 100;
    }
  
    if (cart.items.length === 0) {
      await this.cartModel.deleteOne({ _id: cart._id });
      return { message: 'Cart deleted because no items left' };
    }
  
    const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = (itemTotal * taxPercent) / 100;
    const total = Math.round(itemTotal + cart.deliveryCharges + cart.platformFee + tax - (cart.discount || 0));
  
    Object.assign(cart, {
      itemTotal,
      subtotal: itemTotal,
      tax,
      total,
    });
  
    await cart.save();
  
    return {
      message: 'Item quantity updated',
      updatedCart: cart,
    };
  }
  
  
  async addToCartService(userId: string, itemId: string) {
    // Fetch item details (assume you're fetching from menu/food item service or DB)
    const item = await this.menuItemModel.findById(itemId); // Replace with your actual model
    if (!item) throw new NotFoundException('Item not found');
  
    const restaurantId = item.restaurantId; // Assuming item has restaurantId
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
  
    let cart = await this.cartModel.findOne({ userId });
  
    // Check for existing cart from another restaurant
    if (cart && cart.restaurantId.toString() !== restaurantId.toString()) {
      throw new ConflictException(
        'You already have a cart for another restaurant. Please clear it first.'
      );
    }
  
    // Get user coordinates from Redis
    const redisKey = `address:${userId}:coordinates`;
    const redisValue = await this.redisClient.get(redisKey);
    const { latitude: userLat = 12.9715, longitude: userLon = 77.5946 } = redisValue
      ? JSON.parse(redisValue)
      : {};
  
    const restLat = Number(restaurant.location.coordinates[1]);
    const restLon = Number(restaurant.location.coordinates[0]);
  
    if ([userLat, userLon, restLat, restLon].some(coord => isNaN(coord))) {
      throw new BadRequestException('Invalid location coordinates');
    }
  
    const distance = this.calculateDistance(userLat, userLon, restLat, restLon);
    const deliveryCharges = this.calculateDeliveryCharges(distance);
    const platformFee = 9;
    const taxPercent = 5;
  
    const newItem = {
      itemId: item._id as string,
      name: item.name,
      quantity: 1,
      price: item.price,
      tax: (item.price * 1 * taxPercent) / 100,
    };
  
    if (!cart) {
      // Create new cart
      const itemTotal = item.price;
      const tax = (itemTotal * taxPercent) / 100;
      const total = Math.round(itemTotal + tax + deliveryCharges + platformFee);
  
      cart = new this.cartModel({
        userId,
        restaurantId,
        items: [newItem],
        itemTotal,
        subtotal: itemTotal,
        tax,
        deliveryCharges,
        platformFee,
        total,
        distanceInKm: parseFloat(distance.toFixed(2)),
        discount: 0,
        couponCode: null,
        couponId: null,
      });
    } else {
      // Update existing cart
      const existingItemIndex = cart.items.findIndex(i => i.itemId === itemId);
      if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity += 1;
        cart.items[existingItemIndex].tax =
          (cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity * taxPercent) / 100;
      } else {
        cart.items.push(newItem);
      }
  
      // Recalculate totals
      const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = (itemTotal * taxPercent) / 100;
      const subtotal = itemTotal;
      const total = Math.round(subtotal + tax + deliveryCharges + platformFee - (cart.discount || 0));
  
      Object.assign(cart, {
        itemTotal,
        subtotal,
        tax,
        total,
        deliveryCharges,
        platformFee,
        distanceInKm: parseFloat(distance.toFixed(2)),
      });
    }
  
    await cart.save();
    return {
      message: 'Item added to cart',
      cart,
    };
  }
  
  

  async deleteCartService(userId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
    await this.cartModel.deleteOne({ _id: cart._id });
    return { message: 'Cart deleted successfully' };
  }

  async getCartService(userId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('No active cart found');
    return cart;
  }

  async viewCouponsService(restaurantId: string) {
    return this.couponModel.find({restaurantId:restaurantId})
  }

  // async applyCouponService(userId: string, couponId: string) {
  //   const cart = await this.cartModel.findOne({ userId });
  //   if (!cart) throw new NotFoundException('Cart not found');

  //   const coupon = await this.couponModel.findById(couponId);
  //   if (!coupon) throw new NotFoundException('Coupon not found');

  //   const now = new Date();
  //   if (!coupon.isActive || coupon.expiryDate < now) {
  //     throw new BadRequestException('Coupon is expired or inactive');
  //   }

  //   if (cart.total < coupon.minOrderAmount) {
  //     throw new BadRequestException(`Minimum order amount should be ₹${coupon.minOrderAmount}`);
  //   }

  //   const percentageDiscount = (cart.total * coupon.discountPercent) / 100;
  //   const discount = Math.min(percentageDiscount, coupon.maxDiscount);

  //   cart.total = Math.round(cart.total - discount);
  //   cart.couponCode = coupon.code;
  //   cart.couponId = coupon._id as string;
  //   cart.discount = discount;

  //   await cart.save();

  //   return {
  //     message: 'Coupon applied successfully',
  //     newTotal: cart.total,
  //     discountApplied: discount,
  //     couponCode: coupon.code,
  //   };
  // }
  async applyCouponService(userId: string, couponId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');
  
    const coupon = await this.couponModel.findById(couponId);
    if (!coupon) throw new NotFoundException('Coupon not found');
  
    // ❗ Ensure the coupon belongs to the same restaurant or is global
    if (
      coupon.restaurantId &&
      coupon.restaurantId.toString() !== cart.restaurantId.toString()
    ) {
      throw new BadRequestException('This coupon is not valid for this restaurant');
    }
  
    const now = new Date();
    if (!coupon.isActive || coupon.expiryDate < now) {
      throw new BadRequestException('Coupon is expired or inactive');
    }
  
    if (cart.total < coupon.minOrderAmount) {
      throw new BadRequestException(`Minimum order amount should be ₹${coupon.minOrderAmount}`);
    }
  
    const percentageDiscount = (cart.total * coupon.discountPercent) / 100;
    const discount = Math.min(percentageDiscount, coupon.maxDiscount);
  
    cart.total = Math.round(cart.total - discount);
    cart.couponCode = coupon.code;
    cart.couponId = coupon._id as string;
    cart.discount = discount;
  
    await cart.save();
  
    return {
      message: 'Coupon applied successfully',
      newTotal: cart.total,
      discountApplied: discount,
      couponCode: coupon.code,
    };
  }
  


}
