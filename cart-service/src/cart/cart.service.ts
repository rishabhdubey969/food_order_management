import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateCartDto } from './dto/updateCart.dto';
import { Address, AddressDocument } from './schema/address.schema';
import { Coupon, CouponDocument } from './schema/coupon.schema';
import { Restaurant } from './schema/restaurant.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel('Coupons') private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>
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
    return Math.ceil(distance) * 5; // ₹5 per km
  }

  async addToCartService(userId: string, restaurantId: string, dto: AddToCartDto, addressId: string) {
    const existingCart = await this.cartModel.findOne({ userId, deleted: false });
    if (existingCart && existingCart.restaurantId.toString() !== restaurantId) {
      throw new ConflictException('You already have a cart for another restaurant. Please clear it first.');
    }

    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const address = await this.addressModel.findOne({ _id: addressId, user_id: userId });
    if (!address) throw new NotFoundException('User address not found');

    const userLat = Number(address.latitude);
    const userLon = Number(address.longitude);
    const restLat = Number(restaurant.location.coordinates[1]); // Latitude
    const restLon = Number(restaurant.location.coordinates[0]); // Longitude

    if ([userLat, userLon, restLat, restLon].some(isNaN)) {
      throw new BadRequestException('Invalid location coordinates');
    }

    const distance = this.calculateDistance(userLat, userLon, restLat, restLon);
    const deliveryCharges = this.calculateDeliveryCharges(distance);
    const platformFee = 9;
    const taxPercent = 5;

    const itemTotal = dto.price * dto.quantity;
    const tax = (itemTotal * taxPercent) / 100;
    const subtotal = itemTotal;
    const total = subtotal + tax + deliveryCharges + platformFee;

    const newItem = {
      itemId: dto.itemId,
      name: dto.itemName,
      quantity: dto.quantity,
      price: dto.price,
      tax,
    };

    let cart = existingCart;
    if (!cart) {
      cart = new this.cartModel({
        userId,
        restaurantId,
        items: [newItem],
        itemTotal,
        subtotal,
        tax,
        platformFee,
        deliveryCharges,
        total,
        distanceInKm: parseFloat(distance.toFixed(2)),
        discount: 0,
        couponCode: null,
        couponId: null,
        deleted: false,
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity += dto.quantity;
        cart.items[itemIndex].tax += tax;
      } else {
        cart.items.push(newItem);
      }

      const updatedItemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updatedTax = (updatedItemTotal * taxPercent) / 100;
      const updatedTotal = updatedItemTotal + updatedTax + deliveryCharges + platformFee;

      Object.assign(cart, {
        itemTotal: updatedItemTotal,
        subtotal: updatedItemTotal,
        tax: updatedTax,
        deliveryCharges,
        platformFee,
        total: updatedTotal - (cart.discount || 0),
        distanceInKm: parseFloat(distance.toFixed(2)),
      });
    }

    return await cart.save();
  }

  async updateCartService(userId: string, dto: UpdateCartDto) {
    const cart = await this.cartModel.findOne({ userId, deleted: false });
    if (!cart) throw new NotFoundException('Cart not found');

    const taxPercent = 5;
    const itemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    cart.items[itemIndex] = {
      itemId: dto.itemId,
      name: dto.itemName,
      price: dto.price,
      quantity: dto.quantity,
      tax: (dto.price * dto.quantity * taxPercent) / 100,
    };

    const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = (itemTotal * taxPercent) / 100;
    const subtotal = itemTotal;
    const total = subtotal + cart.deliveryCharges + cart.platformFee + tax - (cart.discount || 0);

    Object.assign(cart, { itemTotal, subtotal, tax, total });
    return await cart.save();
  }

  async deleteCartService(userId: string) {
    const cart = await this.cartModel.findOne({ userId, deleted: false });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.deleted = true;
    return await cart.save();
  }

  async getCartService(userId: string) {
    const cart = await this.cartModel.findOne({ userId, deleted: false });
    if (!cart) throw new NotFoundException('No active cart found');
    return cart;
  }

  async viewCouponsService(restaurantId: string) {
    return this.couponModel.find({
      $or: [
        { restaurantId: new Types.ObjectId(restaurantId) },
        { restaurantId: null },
      ],
      isActive: true,
      expiryDate: { $gt: new Date() },
    });
  }

  async applyCouponService(userId: string, couponId: string) {
    const cart = await this.cartModel.findOne({ userId, deleted: false });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const coupon = await this.couponModel.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
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

    cart.total = cart.total - discount;
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
