import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { AddToCartDto } from './dto/addCart.dto';
import { UpdateQuantityDto } from './dto/updateCart.dto';
import { RemoveItemDto } from './dto/deleteCart.dto';


@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  // Get the cart for a specific user and restaurant
  async getCart(userId: string, restaurantId: string) {
    return await this.cartModel.findOne({ userId, restaurantId });
  }


  private async fetchCouponsFromRestaurantService(restaurantId: string) {
    // Simulated gRPC call — replace with actual gRPC client method
    if (restaurantId === 'abc123') {
      return [
        { code: 'ABC40', discount: 40 },
        { code: 'ABC60', discount: 60 },
      ];
    } else if (restaurantId === 'xyz789') {
      return [
        { code: 'XYZ50', discount: 50 },
      ];
    } else {
      return [];
    }
  }
  



  // Method to calculate the charges including the discount
  private calculateCharges(cart: CartDocument) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const distance = cart.distance;
    if (distance <= 1) cart.deliveryCharges = 39;
    else if (distance <= 5) cart.deliveryCharges = 59;
    else if (distance <= 10) cart.deliveryCharges = 80;
    else cart.deliveryCharges = 78;

    cart.total = cart.subtotal + cart.deliveryCharges - (cart.discount || 0);
  }

  // Add item to cart
  async addToCart(userId: string, dto: AddToCartDto) {
    let cart = await this.getCart(userId, dto.restaurantId);
    if (!cart) {
      cart = new this.cartModel({
        userId,
        restaurantId: dto.restaurantId,
        items: [dto],
      });
    } else {
      const index = cart.items.findIndex((i) => i.itemId === dto.itemId);
      if (index > -1) cart.items[index].quantity += dto.quantity;
      else cart.items.push(dto);
    }

    this.calculateCharges(cart);
    return await cart.save();
  }

  // Update item quantity in cart
  async updateQuantity(userId: string, dto: UpdateQuantityDto) {
    const cart = await this.getCart(userId, dto.restaurantId);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find((i) => i.itemId === dto.itemId);
    if (!item) throw new NotFoundException('Item not found');

    item.quantity = dto.quantity;

    this.calculateCharges(cart);
    return await cart.save();
  }

  // Delete cart for a user and restaurant
  async deleteCartService(userId: string, restaurantId: string) {
    const cart = await this.getCart(userId, restaurantId);
    if (!cart) throw new NotFoundException('Cart not found');
    return await cart.deleteOne();
  }

  // Get available coupons for a restaurant, including default coupons
 // Only fetch restaurant-specific coupons via gRPC (no default fallback)
async getAvailableCoupons(restaurantId: string) {
  // TODO: Replace with actual gRPC call to restaurant microservice
  const restaurantCoupons = await this.fetchCouponsFromRestaurantService(restaurantId);
  return restaurantCoupons;
}


  // Apply a coupon to the cart (specific to a restaurant)
  async applyCoupon(userId: string, restaurantId: string, couponCode: string) {
    const cart = await this.getCart(userId, restaurantId);
    if (!cart) throw new NotFoundException('Cart not found');
  
    const availableCoupons = await this.getAvailableCoupons(restaurantId);
    const coupon = availableCoupons.find((coupon) => coupon.code === couponCode);
  
    if (!coupon) throw new NotFoundException('Coupon not found');
  
    // Apply coupon discount (max 100 allowed)
    const discount = Math.min(coupon.discount, 100);
    cart.discount = discount;
  
    this.calculateCharges(cart);
    await cart.save();
  
    return {
      message: `Coupon ${couponCode} applied successfully!`,
      discount: cart.discount,
      total: cart.total,
    };
  }
  
}
