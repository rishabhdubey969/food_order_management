import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Address, AddressDocument } from './schema/address.schema';
import { CouponDocument } from './schema/coupon.schema';
import { Restaurant } from './schema/restaurant.schema';
import Redis from 'ioredis';
import { MenuItem } from './schema/menu-item.schema';
import { EventPattern } from '@nestjs/microservices';
import { WinstonLogger } from '../logger/winston-logger.service';
import { CartConstants } from './constant/cart.constants';
import { AddCartDto } from './dto/addCart.dto';
import { UpdateCartDto } from './dto/updateCart.dto';

@Injectable()
export class CartService {
  constructor(
    //Injecting models for cart, coupon, address, restaurant, and menu item
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel('Coupons') private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,

    // Injecting Redis client for caching user coordinates
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,

    // Injecting Winston logger for logging
    private readonly logger: WinstonLogger, 
  ) {}


 // ADD TO CART
async addToCartService(userId: string, restaurantId: string, itemId: string) {
  this.logger.log(`Adding item ${itemId} to cart for user ${userId}`, CartService.name);

  //finding cart for a user
  let cart = await this.cartModel.findOne({ userId });

  // Checking if restaurant exists
  const restaurant = await this.restaurantModel.findById(restaurantId);
  if (!restaurant) {
    this.logger.warn(`Restaurant ${restaurantId} not found`, CartService.name);
    throw new NotFoundException('Restaurant not found');
  }

  // Checking if item exists and is available
  const item = await this.menuItemModel.findById(itemId);
  if (!item) {
    this.logger.warn(`Item ${itemId} not found`, CartService.name);
    throw new NotFoundException('Item not found');
  }

  // Checking if item is available
  if (!item.isAvailable) {
    this.logger.warn(`Item ${itemId} is unavailable`, CartService.name);
    throw new ConflictException('This item is currently unavailable');
  }

  // Checking if the cart already exists for a different restaurant
  if (cart && String(cart.restaurantId) !== String(restaurantId)) {
    this.logger.warn(`Cart conflict: existing cart from different restaurant`, CartService.name);
    throw new ConflictException('You already have a cart for another restaurant');
  }

  // Fetching user's coordinates from Redis
  const redisKey = `address:${userId}:coordinates`;
  const redisValue = await this.redisClient.get(redisKey);
  const { latitude = CartConstants.DEFAULT_LAT, longitude = CartConstants.DEFAULT_LON } =
    redisValue ? JSON.parse(redisValue) : {};

    //fetching coordinates of restaurant
  const restaurantLat = restaurant.location.coordinates[1];
  const restaurantLon = restaurant.location.coordinates[0];

  // Calculating distance and delivery charges using helper methods 
  const distance = this.calculateDistance(latitude, longitude, restaurantLat, restaurantLon);
  const deliveryCharges = this.calculateDeliveryCharges(distance);

  // Creating a new item object to add to the cart
  const newItem = {
    itemId: item._id as string, 
    name: item.name,
    quantity: 1,
    price: item.price,
    tax: this.calculateTax(item.price),
  };

  // If no cart exists, create a new one
  // If cart exists, update it with the new item or increase quantity
  if (!cart) {
    const totals = this.calculateCartTotals([newItem], deliveryCharges);
    cart = new this.cartModel({
      userId,
      restaurantId,
      items: [newItem],
      deliveryCharges,
      distanceInKm: parseFloat(distance.toFixed(2)),
      discount: 0,
      couponCode: null,
      couponId: null,
      ...totals,
    });
    this.logger.log(`New cart created for user ${userId}`, CartService.name);
  } else {
    // If cart exists, check if item is already in the cart
    const index = this.findItemIndex(cart.items, itemId);
    if (index >= 0) {
      cart.items[index].quantity += 1;
      cart.items[index].tax = this.calculateTax(cart.items[index].price * cart.items[index].quantity);
      this.logger.verbose(`Increased quantity of item ${itemId} in cart`, CartService.name);
    } else {
      cart.items.push(newItem);
      this.logger.verbose(`Item ${itemId} added to existing cart`, CartService.name);
    }

    // Recalculate totals after adding the item
    const totals = this.calculateCartTotals(cart.items, cart.deliveryCharges, cart.discount || 0);
    Object.assign(cart, totals);
    this.logger.log(`Cart for user ${userId} updated`, CartService.name);
  }

  await cart.save();

  return {
    message: 'Item added to cart',
    cart,
  };
}



  // Remove item service
async removeItemService(userId: string, itemId: string) {
  this.logger.log(`Attempting to remove item ${itemId} from user ${userId}'s cart`, CartService.name);

  //finding cart for user
  const cart = await this.cartModel.findOne({ userId });
  if (!cart) {
    this.logger.warn(`Cart not found for user ${userId}`, CartService.name);
    throw new NotFoundException('Cart not found');
  }

  //finding an item in the user's cart
  const itemIndex = this.findItemIndex(cart.items, itemId);
  if (itemIndex === -1) {
    this.logger.warn(`Item ${itemId} not found in cart`, CartService.name);
    throw new NotFoundException('Item not found in cart');
  }

  // decreasing the quantity of the item
  const item = cart.items[itemIndex];
  item.quantity -= 1;

  // if quantity is zero or less, remove the item from the cart
  if (item.quantity <= 0) {
    cart.items.splice(itemIndex, 1);
    this.logger.log(`Item ${itemId} removed completely from cart`, CartService.name);
  } else {
    item.tax = this.calculateTax(item.price * item.quantity);
    this.logger.verbose(`Item ${itemId} quantity reduced to ${item.quantity}`, CartService.name);
  }

  // if the cart is now empty, delete the cart
  if (cart.items.length === 0) {
    await this.cartModel.deleteOne({ _id: cart._id });
    this.logger.warn(`Cart for user ${userId} deleted because no items left`, CartService.name);
    return { message: 'Cart deleted because no items left' };
  }

  // Recalculate totals after removing the item
  const totals = this.calculateCartTotals(cart.items, cart.deliveryCharges, cart.discount || 0);
  Object.assign(cart, totals);

  await cart.save();

  this.logger.log(`Cart for user ${userId} updated successfully`, CartService.name);
  return {
    message: 'Item quantity updated',
    updatedCart: cart,
  };
}


//// Delete cart service
//Grpc service to delete a cart for a user
  @EventPattern('orderCreated')
  async deleteCartService(userId: string) {
    this.logger.warn(`Deleting cart for user ${userId}`, CartService.name);
    
    // Finding the cart for the user
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.warn(`Cart not found for user ${userId}`, CartService.name);
      throw new NotFoundException('Cart not found');
    }
  // Deleting the cart
    await this.cartModel.deleteOne({ _id: cart._id });
    this.logger.log(`Cart deleted for user ${userId}`, CartService.name);
    return { message: 'Cart deleted successfully' };
  }


  // Get cart service
  async getCartService(userId: string) {
    this.logger.verbose(`Fetching cart for user ${userId}`, CartService.name);

    //finding cart for user
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      this.logger.warn(`No cart found for user ${userId}`, CartService.name);
      throw new NotFoundException('No active cart found');
    }
    return cart;
  }


  //getting coupon service
  async viewCouponsService(restaurantId: string) {
    this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`, CartService.name);
    return this.couponModel.find({ restaurantId });
  }

  //applying coupon to a cart
  async applyCouponService(userId: string, couponId: string) {
    this.logger.log(`Applying coupon ${couponId} to cart of user ${userId}`, CartService.name);

    //finding cart for user
    const cart = await this.cartModel.findOne({ userId });

    
    if (!cart) {
      this.logger.warn(`Cart not found for user ${userId}`, CartService.name);
      throw new NotFoundException('Cart not found');
    }

    // Finding the coupon by its ID
    const coupon = await this.couponModel.findById(couponId);
    if (!coupon) {
      this.logger.warn(`Coupon ${couponId} not found`, CartService.name);
      throw new NotFoundException('Coupon not found');
    }

    //// Check if the coupon is valid for the restaurant associated with the cart
    if (coupon.restaurantId && coupon.restaurantId.toString() !== cart.restaurantId.toString()) {
      this.logger.warn(`Coupon ${couponId} is not valid for restaurant ${cart.restaurantId}`, CartService.name);
      throw new BadRequestException('This coupon is not valid for this restaurant');
    }

    //// Check if the coupon is active and not expired
    const now = new Date();
    if (!coupon.isActive || coupon.expiryDate < now) {
      this.logger.warn(`Coupon ${couponId} is expired or inactive`, CartService.name);
      throw new BadRequestException('Coupon is expired or inactive');
    }

    //// Check if the cart total meets the minimum order amount required for the coupon
    if (cart.total < coupon.minOrderAmount) {
      this.logger.warn(`Cart total is less than coupon minimum amount`, CartService.name);
      throw new BadRequestException(`Minimum order amount should be ₹${coupon.minOrderAmount}`);
    }

    //// Calculate the discount based on the coupon's discount percentage and maximum discount limit
    const percentageDiscount = (cart.total * coupon.discountPercent) / 100;
    const discount = Math.min(percentageDiscount, coupon.maxDiscount);

    // Update the cart's total, coupon details, and discount amount
    cart.total = Math.round(cart.total - discount);
    cart.couponCode = coupon.code;
    cart.couponId = coupon._id as string;
    cart.discount = discount;

    await cart.save();

    this.logger.log(`Coupon ${coupon.code} applied to user ${userId}'s cart`, CartService.name);

    return {
      message: 'Coupon applied successfully',
      newTotal: cart.total,
      discountApplied: discount,
      couponCode: coupon.code,
    };
  }





/////SOME IMPROVEMENTS///////
// CREATE
async createCart(userId: string, dto: AddCartDto) {
  const existing = await this.cartModel.findOne({ userId });
  if (existing) {
    this.logger.warn(`Cart already exists for user ${userId}`);
    throw new ConflictException('Cart already exists. Use update instead.');
  }
  return this._processCart(userId, dto.restaurantId, dto.items);
}

// UPDATE
async updateCart(userId: string, dto: UpdateCartDto) {
  const existing = await this.cartModel.findOne({ userId });
  if (!existing) throw new NotFoundException('Cart does not exist. Use add instead.');

  // If all items are zero, delete the cart
  if (!dto.items.some(i => i.quantity > 0)) {
    await this.cartModel.deleteOne({ _id: existing._id });
    this.logger.warn(`Deleted cart for user ${userId} — all items have quantity 0`);
    return { message: 'Cart deleted because all items have quantity zero' };
  }

  return this._processCart(userId, dto.restaurantId, dto.items);
}

// REUSABLE PROCESSOR
private async _processCart(userId: string, restaurantId: string, itemsInput: { itemId: string; quantity: number }[]) {
  const restaurant = await this.restaurantModel.findById(restaurantId);
  if (!restaurant) throw new NotFoundException('Restaurant not found');

  const redisKey = `address:${userId}:coordinates`;
  const redisValue = await this.redisClient.get(redisKey);
  const { latitude = CartConstants.DEFAULT_LAT, longitude = CartConstants.DEFAULT_LON } =
    redisValue ? JSON.parse(redisValue) : {};

  const restaurantLat = restaurant.location.coordinates[1];
  const restaurantLon = restaurant.location.coordinates[0];
  const distance = this.calculateDistance(latitude, longitude, restaurantLat, restaurantLon);
  const deliveryCharges = this.calculateDeliveryCharges(distance);

  const cartItems: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    tax: number;
  }[] = [];

  

  for (const itemEntry of itemsInput) {
    const menuItem = await this.menuItemModel.findById(itemEntry.itemId);
    if (!menuItem) throw new NotFoundException(`Item ${itemEntry.itemId} not found`);
    if (!menuItem.isAvailable) throw new ConflictException(`Item ${menuItem.name} is unavailable`);

    if (itemEntry.quantity > 0) {
      const tax = this.calculateTax(menuItem.price * itemEntry.quantity);
      cartItems.push({
        itemId: menuItem._id as string,
        name: menuItem.name,
        quantity: itemEntry.quantity,
        price: menuItem.price,
        tax,
      });
    }
  }

  const totals = this.calculateCartTotals(cartItems, deliveryCharges);

  const updatedCart = await this.cartModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        restaurantId,
        items: cartItems,
        deliveryCharges,
        distanceInKm: parseFloat(distance.toFixed(2)),
        discount: 0,
        couponCode: null,
        couponId: null,
        ...totals,
      },
    },
    { new: true, upsert: true },
  );

  this.logger.log(`Cart processed for user ${userId}`);
  return {
    message: 'Cart updated successfully',
    cart: updatedCart,
  };
}











  // ===================================
  // HELPER METHODS
  // ===================================

  // Converts a value from degrees to radians
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }


  // Calculates the distance between two geographical points using the Haversine formula
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


  // Calculates delivery charges based on the distance
  private calculateDeliveryCharges(distance: number): number {
    return Math.ceil(distance * CartConstants.DELIVERY_CHARGE_PER_KM);
  }


// Calculates the tax for a given amount
  private calculateTax(amount: number): number {
    return (amount * CartConstants.TAX_PERCENT) / 100;
  }


  // Calculates the total cost of the cart, including item totals, tax, delivery charges, and platform fees
  private calculateCartTotals(
    items: {
      price: number;
      quantity: number;
    }[],
    deliveryCharges: number,
    discount = 0,  // Default discount is 0
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


  // Finds the index of an item in the cart by its itemId
  private findItemIndex(items: any[], itemId: string): number {
    return items.findIndex(i => String(i.itemId) === itemId);
  }

  


}
