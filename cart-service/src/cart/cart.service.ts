import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Address, AddressDocument } from './schema/address.schema';
import { Coupon, CouponDocument } from './schema/coupon.schema';
import { Restaurant } from './schema/restaurant.schema';
import Redis from 'ioredis';
import { MenuItem } from './schema/menu-item.schema';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

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
    return 6371 * 2 * Math.atan2(
      Math.sqrt(
        Math.sin(this.toRad(lat2 - lat1) / 2) ** 2 +
        Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(this.toRad(lon2 - lon1) / 2) ** 2
      ),
      Math.sqrt(
        1 -
        Math.sin(this.toRad(lat2 - lat1) / 2) ** 2 +
        Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(this.toRad(lon2 - lon1) / 2) ** 2
      )
    );
  }

  private calculateDeliveryCharges(distance: number): number {
    return Math.ceil(distance) * 5;
  }

  async removeItemService(cartId: string, itemId: string) {
    this.logger.log(`Attempting to remove item ${itemId} from cart ${cartId}`);
    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      this.logger.warn(`Cart ${cartId} not found`);
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      this.logger.warn(`Item ${itemId} not found in cart`);
      throw new NotFoundException('Item not found in cart');
    }

    this.logger.verbose(`Item ${itemId} found at index ${itemIndex}`);

    const taxPercent = 5;
    const item = cart.items[itemIndex];
    item.quantity -= 1;

    if (item.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
      this.logger.log(`Item ${itemId} removed completely from cart`);
    } else {
      item.tax = (item.price * item.quantity * taxPercent) / 100;
      this.logger.log(`Item ${itemId} quantity decreased to ${item.quantity}`);
    }

    if (cart.items.length === 0) {
      await this.cartModel.deleteOne({ _id: cart._id });
      this.logger.warn(`Cart ${cartId} deleted because no items left`);
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

    this.logger.log(`Cart ${cartId} updated successfully`);
    return {
      message: 'Item quantity updated',
      updatedCart: cart,
    };
  }

  async addToCartService(userId: string, itemId: string) {
    this.logger.log(`Adding item ${itemId} to cart for user ${userId}`);
    const item = await this.menuItemModel.findById(itemId);
    if (!item) {
      this.logger.warn(`Item ${itemId} not found`);
      throw new NotFoundException('Item not found');
    }

    const restaurantId = item.restaurantId;
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) {
      this.logger.warn(`Restaurant ${restaurantId} not found`);
      throw new NotFoundException('Restaurant not found');
    }

    let cart = await this.cartModel.findOne({ userId });
    if (cart && cart.restaurantId.toString() !== restaurantId.toString()) {
      this.logger.warn(`User ${userId} tried to add item from different restaurant`);
      throw new ConflictException('You already have a cart for another restaurant. Please clear it first.');
    }

    const redisKey = `address:${userId}:coordinates`;
    const redisValue = await this.redisClient.get(redisKey);
    const { latitude: userLat = 12.9715, longitude: userLon = 77.5946 } = redisValue
      ? JSON.parse(redisValue)
      : {};

    const restLat = Number(restaurant.location.coordinates[1]);
    const restLon = Number(restaurant.location.coordinates[0]);

    if ([userLat, userLon, restLat, restLon].some(coord => isNaN(coord))) {
      this.logger.error('Invalid location coordinates');
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
      tax: (item.price * taxPercent) / 100,
    };

    if (!cart) {
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
      this.logger.log(`New cart created for user ${userId}`);
    } else {
      const existingItemIndex = cart.items.findIndex(i => i.itemId === itemId);
      if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity += 1;
        cart.items[existingItemIndex].tax =
          (cart.items[existingItemIndex].price *
            cart.items[existingItemIndex].quantity *
            taxPercent) / 100;
        this.logger.verbose(`Item ${itemId} quantity increased`);
      } else {
        cart.items.push(newItem);
        this.logger.verbose(`Item ${itemId} added to existing cart`);
      }

      const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = (itemTotal * taxPercent) / 100;
      const total = Math.round(itemTotal + tax + deliveryCharges + platformFee - (cart.discount || 0));

      Object.assign(cart, {
        itemTotal,
        subtotal: itemTotal,
        tax,
        total,
        deliveryCharges,
        platformFee,
        distanceInKm: parseFloat(distance.toFixed(2)),
      });

      this.logger.log(`Cart for user ${userId} updated`);
    }

    await cart.save();

    return {
      message: 'Item added to cart',
      cart,
    };
  }

  async deleteCartService(userId: string) {
    this.logger.warn(`Deleting cart for user ${userId}`);
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.warn(`Cart not found for user ${userId}`);
      throw new NotFoundException('Cart not found');
    }

    await this.cartModel.deleteOne({ _id: cart._id });
    this.logger.log(`Cart deleted for user ${userId}`);
    return { message: 'Cart deleted successfully' };
  }

  async getCartService(userId: string) {
    this.logger.verbose(`Fetching cart for user ${userId}`);
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.warn(`No cart found for user ${userId}`);
      throw new NotFoundException('No active cart found');
    }
    return cart;
  }

  async viewCouponsService(restaurantId: string) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`);
    return this.couponModel.find({ restaurantId });
  }

  async applyCouponService(userId: string, couponId: string) {
    this.logger.log(`Applying coupon ${couponId} to cart of user ${userId}`);
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.warn(`Cart not found for user ${userId}`);
      throw new NotFoundException('Cart not found');
    }

    const coupon = await this.couponModel.findById(couponId);
    if (!coupon) {
      this.logger.warn(`Coupon ${couponId} not found`);
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.restaurantId && coupon.restaurantId.toString() !== cart.restaurantId.toString()) {
      this.logger.warn(`Coupon ${couponId} is not valid for restaurant ${cart.restaurantId}`);
      throw new BadRequestException('This coupon is not valid for this restaurant');
    }

    const now = new Date();
    if (!coupon.isActive || coupon.expiryDate < now) {
      this.logger.warn(`Coupon ${couponId} is expired or inactive`);
      throw new BadRequestException('Coupon is expired or inactive');
    }

    if (cart.total < coupon.minOrderAmount) {
      this.logger.warn(`Cart total is less than coupon minimum amount`);
      throw new BadRequestException(`Minimum order amount should be ₹${coupon.minOrderAmount}`);
    }

    const percentageDiscount = (cart.total * coupon.discountPercent) / 100;
    const discount = Math.min(percentageDiscount, coupon.maxDiscount);

    cart.total = Math.round(cart.total - discount);
    cart.couponCode = coupon.code;
    cart.couponId = coupon._id as string;
    cart.discount = discount;

    await cart.save();

    this.logger.log(`Coupon ${coupon.code} applied to user ${userId}'s cart`);

    return {
      message: 'Coupon applied successfully',
      newTotal: cart.total,
      discountApplied: discount,
      couponCode: coupon.code,
    };
  }
}
