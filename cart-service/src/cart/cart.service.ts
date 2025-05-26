// import { Injectable, NotFoundException, Param } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Cart, CartDocument } from './schema/cart.schema';
// import { AddToCartDto } from './dto/addCart.dto';
// import { UpdateCartDto } from './dto/updateCart.dto';
// import { RestaurantCouponsDocument } from './schema/coupon.schema';
// import { Address } from './schema/address.schema';
// import { Post } from '@nestjs/common';

// @Injectable()
// export class CartService {
//   constructor(
//     @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
//     @InjectModel('Coupons') private readonly couponModel: Model<RestaurantCouponsDocument>,
//     @InjectModel('Address') private addressModel: Model<Address>,
//     // @InjectModel(Restaurant.name) private restaurantModel: Model<Restaurant>,
//     // @InjectModel(UserAddress.name) private userAddressModel: Model<UserAddress>,
    
//   ) {}

//   private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//     const R = 6371; // km
//     const dLat = this.toRad(lat2 - lat1);
//     const dLon = this.toRad(lon2 - lon1);
//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;

//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }

//   private toRad(value: number): number {
//     return (value * Math.PI) / 180;
//   }

//   private calculateDeliveryCharges(distance: number): number {
//     // Example: ₹10 per km
//     return Math.ceil(distance) * 10;
//   }

//   async addToCartService(userId: string, restaurantId: string, dto: AddToCartDto) {
//     const restaurant = await this.restaurantModel.findById(restaurantId);
//     if (!restaurant) throw new NotFoundException('Restaurant not found');

//     const userAddress = await this.userAddressModel.findOne({ userId });
//     if (!userAddress) throw new NotFoundException('User address not found');

//     const distance = this.calculateDistance(
//       restaurant.latitude,
//       restaurant.longitude,
//       userAddress.latitude,
//       userAddress.longitude,
//     );
//     const deliveryCharges = this.calculateDeliveryCharges(distance);
//     const platformFee = 9;

//     const newItem = {
//       itemId: dto.itemId,
//       name: dto.itemName,
//       quantity: dto.quantity,
//       price: dto.price,
//     };

//     let cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });

//     if (!cart) {
//       const itemTotal = dto.price * dto.quantity;
//       const subtotal = itemTotal;
//       const tax = restaurant.taxPercentage
//         ? (itemTotal * restaurant.taxPercentage) / 100
//         : 0;

//       const total = subtotal + tax + deliveryCharges + platformFee;

//       cart = new this.cartModel({
//         userId,
//         restaurantId,
//         items: [newItem],
//         itemTotal,
//         subtotal,
//         tax,
//         platformFee,
//         deliveryCharges,
//         distanceInKm: parseFloat(distance.toFixed(2)),
//         total,
//         deleted: false,
//       });

//       return await cart.save();
//     }

//     // Update existing cart
//     const existingItemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
//     if (existingItemIndex >= 0) {
//       cart.items[existingItemIndex].quantity += dto.quantity;
//     } else {
//       cart.items.push(newItem);
//     }

//     const itemTotal = cart.items.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0,
//     );

//     const tax = restaurant.taxPercentage
//       ? (itemTotal * restaurant.taxPercentage) / 100
//       : 0;

//     const subtotal = itemTotal;
//     const total = subtotal + tax + deliveryCharges + platformFee;

//     Object.assign(cart, {
//       itemTotal,
//       subtotal,
//       tax,
//       deliveryCharges,
//       platformFee,
//       distanceInKm: parseFloat(distance.toFixed(2)),
//       total,
//     });

//     return await cart.save();
//   }


//   async updateCartService(userId: string, restaurantId: string, dto: UpdateCartDto) {
//     const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
//     if (!cart) throw new NotFoundException('Cart not found');

//     const itemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
//     if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

//     cart.items[itemIndex] = {
//       itemId: dto.itemId,
//       name: dto.itemName,
//       price: dto.price,
//       quantity: dto.quantity,
//     };

//     const itemTotal = cart.items.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0,
//     );

//     const restaurant = await this.restaurantModel.findById(restaurantId);
//     const tax = restaurant.taxPercentage
//       ? (itemTotal * restaurant.taxPercentage) / 100
//       : 0;

//     const subtotal = itemTotal;
//     const total = subtotal + cart.deliveryCharges + cart.platformFee + tax;

//     Object.assign(cart, {
//       itemTotal,
//       subtotal,
//       tax,
//       total,
//     });

//     return await cart.save();
//   }




//   async deleteCartService(cartId: string) {
//     const cart = await this.cartModel.findOne({ cartId });
//     if (!cart) throw new NotFoundException('Cart not found');
//       cart.deleted = true;
//     return await cart.save();
//   }


//   async removeCartService(userId: string, restaurantId: string) {
//     const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
//     if (!cart) throw new NotFoundException('Cart not found');
//     cart.deleted = true;
//     return await cart.save();
//   } 

//   async viewAllCartsService(userId: string) {
//     return await this.cartModel.find({ userId, deleted: false });
//   }

//   async specificCartService(userId: string, restaurantId: string) {
//     const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
//     if (!cart) throw new NotFoundException('Cart not found');
//     return cart;
//   }

//   async viewCouponsService(restaurantId: string) {
//     const coupons= this.couponModel.findOne({restaurantId});
//     if (!coupons) throw new NotFoundException('Coupons not found for this restaurant');
//     return coupons;
//   }

//   async applyCouponService(couponId: string) {
    
//   }

//   @Post('checkoutAll/:userId')
//   async checkoutAllCarts(@Param('userId') userId: string) {
//     const carts = await this.cartModel.find({ userId }).exec();
  
//     if (!carts.length) {
//       throw new NotFoundException('No carts found for checkout');
//     }
  
//     // Process each cart separately - create an order, apply coupons, etc.
//     const orders = [];
//     for (const cart of carts) {
//       const order = await this.createOrderFromCart(cart);
//       orders.push(order);
//     }
  
//     // After successful orders, clear all carts or mark them as checked out
//     await this.cartModel.deleteMany({ userId });
  
//     return {
//       message: 'Checkout completed for all carts',
//       orders,
//     };
//   }
  

// }




import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateCartDto } from './dto/updateCart.dto';
import { Restaurant } from './schema/restaurant.schema';
import { UserAddress } from './schema/userAddress.schema';
import { RestaurantCouponsDocument } from './schema/coupon.schema';
import { Address } from './schema/address.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel('UserAddress') private readonly userAddressModel: Model<UserAddress>,
    @InjectModel('Coupons') private readonly couponModel: Model<RestaurantCouponsDocument>,
    @InjectModel('Address') private readonly addressModel: Model<Address>,
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
    return Math.ceil(distance) * 10; // ₹10 per km
  }

  async addToCartService(userId: string, restaurantId: string, dto: AddToCartDto) {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const userAddress = await this.userAddressModel.findOne({ userId });
    if (!userAddress) throw new NotFoundException('User address not found');

    const distance = this.calculateDistance(
      restaurant.latitude,
      restaurant.longitude,
      userAddress.latitude,
      userAddress.longitude,
    );
    const deliveryCharges = this.calculateDeliveryCharges(distance);
    const platformFee = 9;

    const newItem = {
      itemId: dto.itemId,
      name: dto.itemName,
      quantity: dto.quantity,
      price: dto.price,
    };

    let cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });

    if (!cart) {
      const itemTotal = dto.price * dto.quantity;
      const subtotal = itemTotal;
      const tax = restaurant.taxPercentage ? (itemTotal * restaurant.taxPercentage) / 100 : 0;
      const total = subtotal + tax + deliveryCharges + platformFee;

      cart = new this.cartModel({
        userId,
        restaurantId,
        items: [newItem],
        itemTotal,
        subtotal,
        tax,
        platformFee,
        deliveryCharges,
        distanceInKm: parseFloat(distance.toFixed(2)),
        total,
        deleted: false,
      });

      return await cart.save();
    }

    const existingItemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += dto.quantity;
    } else {
      cart.items.push(newItem);
    }

    const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = restaurant.taxPercentage ? (itemTotal * restaurant.taxPercentage) / 100 : 0;
    const subtotal = itemTotal;
    const total = subtotal + tax + deliveryCharges + platformFee;

    Object.assign(cart, {
      itemTotal,
      subtotal,
      tax,
      deliveryCharges,
      platformFee,
      distanceInKm: parseFloat(distance.toFixed(2)),
      total,
    });

    return await cart.save();
  }

  async updateCartService(userId: string, restaurantId: string, dto: UpdateCartDto) {
    const cart = await this.cartModel.findOne({ userId, restaurantId, deleted: false });
    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex(item => item.itemId === dto.itemId);
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    cart.items[itemIndex] = {
      itemId: dto.itemId,
      name: dto.itemName,
      price: dto.price,
      quantity: dto.quantity,
    };

    const itemTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const restaurant = await this.restaurantModel.findById(restaurantId);
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
    cart.deleted = true;
    return await cart.save();
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
  const userCarts = await this.cartModel.find({ userId });

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
    deliveryTotal += cart.deliveryCharge ?? 0;
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
