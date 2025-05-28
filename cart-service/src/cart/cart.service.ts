
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Mongoose } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateCartDto } from './dto/updateCart.dto';
import { Address, AddressDocument } from './schema/address.schema';

import { RestaurantCouponsDocument } from './schema/coupon.schema';
import { RestaurantDocument } from './schema/restaurant.schema';
import { Types } from 'mongoose';


@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel('Coupons') private readonly couponModel: Model<RestaurantCouponsDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<RestaurantDocument>

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
    return Math.ceil(distance) * 5; // ₹10 per km
  }


async addToCartService(userId: string, restaurantId: string, dto: AddToCartDto, ) {
  const restaurant = await this.restaurantModel.findById(restaurantId);
  if (!restaurant) throw new NotFoundException('Restaurant not found');

  const userAddress = await this.addressModel.findOne({ user_id: userId });

  if (!userAddress) throw new NotFoundException('User address not found');
  console.log(userAddress)

  // Validate latitude and longitude
  const restaurantLat = Number(restaurant.latitude);
  const restaurantLon = Number(restaurant.longitude);
  const userLat = Number(userAddress.latitude);
  const userLon = Number(userAddress.longitude);

  console.log('Restaurant Latitude:', restaurant.latitude);
console.log('Restaurant Longitude:', restaurant.longitude);
console.log('User Latitude:', userAddress.latitude);
console.log('User Longitude:', userAddress.longitude);

  if (
    isNaN(restaurantLat) ||
    isNaN(restaurantLon) ||
    isNaN(userLat) ||
    isNaN(userLon)
  ) {
    throw new BadRequestException('Invalid latitude or longitude values');
  }

  const distance = this.calculateDistance(restaurantLat, restaurantLon, userLat, userLon);
  if (isNaN(distance)) {
    throw new BadRequestException('Failed to calculate distance');
  }

  const deliveryCharges = this.calculateDeliveryCharges(distance);
  if (isNaN(deliveryCharges)) {
    throw new BadRequestException('Failed to calculate delivery charges');
  }

  const platformFee = 9;
  const itemTotal = dto.price * dto.quantity;
  const itemTax = restaurant.taxPercentage
    ? (itemTotal * restaurant.taxPercentage) / 100
    : 0;

  const newItem = {
    itemId: dto.itemId,
    name: dto.itemName,
    quantity: dto.quantity,
    price: dto.price,
    tax: itemTax,
  };

  let cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });

  if (!cart) {
    const subtotal = itemTotal;
    const total = subtotal + itemTax + deliveryCharges + platformFee;

    cart = new this.cartModel({
      userId,
      restaurantId,
      items: [newItem],
      itemTotal,
      subtotal,
      tax: itemTax,
      platformFee,
      deliveryCharges,
      distanceInKm: parseFloat(distance.toFixed(2)),
      total,
      deleted: false,
    });

    return await cart.save();
  }

  // For adding new item
  const existingItemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += dto.quantity;
    cart.items[existingItemIndex].tax += itemTax;
  } else {
    cart.items.push(newItem);
  }

  const updatedItemTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const updatedTax = restaurant.taxPercentage
    ? (updatedItemTotal * restaurant.taxPercentage) / 100
    : 0;

  const updatedTotal = updatedItemTotal + updatedTax + deliveryCharges + platformFee;

  Object.assign(cart, {
    itemTotal: updatedItemTotal,
    subtotal: updatedItemTotal,
    tax: updatedTax,
    total: updatedTotal,
    distanceInKm: parseFloat(distance.toFixed(2)),
    deliveryCharges,
  });

  return await cart.save();
}



    async updateCartService(userId: string, restaurantId: string, dto: UpdateCartDto) {
      const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
      if (!cart) throw new NotFoundException('Cart not found');
    
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) throw new NotFoundException('Restaurant not found');
    
      const itemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
      if (itemIndex === -1) throw new NotFoundException('Item not found in cart');
    
      cart.items[itemIndex] = {
        itemId: dto.itemId,
        name: dto.itemName,
        price: dto.price,
        quantity: dto.quantity,
        tax: (dto.price * dto.quantity * (restaurant.taxPercentage || 0)) / 100,
      };
    
      const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = restaurant.taxPercentage ? (itemTotal * restaurant.taxPercentage) / 100 : 0;
      const subtotal = itemTotal;
      const total = subtotal + cart.deliveryCharges + cart.platformFee + tax;
    
      Object.assign(cart, { itemTotal, subtotal, tax, total });
      return await cart.save();
    }
    
  
  async deleteCartService(cartId: string) {
    const cart = await this.cartModel.findOne({ _id: cartId });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.deleted = true;
    return await cart.save();
  }

  async removeCartService(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
    if (!cart) throw new NotFoundException('Cart not found');
    await this.cartModel.deleteOne({ _id: cart._id });
    return { message: 'Cart has been permanently deleted' };
}

  async viewAllCartsService(userId: string) {
    return await this.cartModel.find({ userId, deleted: false });
  }

  async specificCartService(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async viewCouponsService(restaurantId: string) {
    const coupons = await this.couponModel.findOne({ restaurantId });
    if (!coupons) throw new NotFoundException('Coupons not found for this restaurant');
    return coupons;
  }

  async applyCouponService(cartId: string, couponCode: string) {
    const cart = await this.cartModel.findById(cartId);
    if (!cart || cart.deleted) throw new NotFoundException('Cart not found');

    const couponDoc = await this.couponModel.findOne({ restaurantId: cart.restaurantId });
    if (!couponDoc || !couponDoc.coupons || !couponDoc.coupons.length)
      throw new NotFoundException('No coupons found for this restaurant');

    const coupon = couponDoc.coupons.find(c => c.code === couponCode);
    if (!coupon) throw new BadRequestException('Invalid coupon code');

    const discountAmount = (cart.total * coupon.discountPercentage) / 100;
    const newTotal = cart.total - discountAmount;

    cart.couponCode = couponCode;
    cart.discount = discountAmount;
    cart.total = parseFloat(newTotal.toFixed(2));

    await cart.save();
    return { message: 'Coupon applied successfully', cart };
  }


async checkoutAllCarts(userId: string) {
  const userCarts = await this.cartModel.find({ userId, deleted:false});

  if (userCarts.length === 0) {
    throw new NotFoundException('No carts found for this user');
  }

  let itemsTotal = 0;
  let taxTotal = 0;
  let deliveryTotal = 0;
  const PLATFORM_FEE = 9;

  for (const cart of userCarts) {
    for (const item of cart.items) {
      itemsTotal += item.price * item.quantity;
      taxTotal += item.tax ?? 0;
    }
    deliveryTotal += cart.deliveryCharges ?? 0;
  }

  const grandTotal = itemsTotal + taxTotal + deliveryTotal + PLATFORM_FEE;

  return {
    itemsTotal,
    taxTotal,
    deliveryTotal,
    platformFee: PLATFORM_FEE,
    grandTotal,
  };
}


}
