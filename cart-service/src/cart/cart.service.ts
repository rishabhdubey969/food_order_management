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
import { MultipleItemDto } from './dto/multipleItem.dto';
import { CouponDto, RestaurantDto } from './dto/param.dto';

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

  /**
   * Adds an item to the user's cart. If the cart doesn't exist, it creates a new one.
   *
   * Function Flow:
   * - Validates if the restaurant and menu item exist and are available.
   * - Ensures the item belongs to the same restaurant as the current cart.
   * - Calculates distance between user and restaurant using Haversine formula.
   * - Computes delivery charges based on distance.
   * - Adds the new item or increments quantity if already present.
   * - Recalculates tax and totals for the cart.
   * - Updates or inserts the cart in the database (upsert).
   * - Handles edge cases where updated cart is not returned.
   *
   * @param userId - The ID of the user adding an item to the cart.
   * @param dto - Data Transfer Object containing itemId and restaurantId.
   * @returns The updated cart object.
   * @throws NotFoundException if the restaurant or menu item is not found.
   * @throws ConflictException if the item belongs to a different restaurant or is unavailable.
   * @throws InternalServerErrorException if the cart update fails unexpectedly.
   */
  async addToCartService(userId: string, dto: AddCartDto) {
    try {
      this.logger.log(`Adding item ${dto.itemId} for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);

      // Fetch cart
      let cart = await this.carts.findOne({ userId: userObjId });

      // Fetch restaurant
      const restaurant = await this.restaurants.findOne({
        _id: new ObjectId(dto.restaurantId),
      });
      if (!restaurant) throw new NotFoundException(ResponseMessages.CART.RESTAURANT_NOT_FOUND);

      // Fetch menu item
      const menuItem = await this.menuItems.findOne({
        _id: new ObjectId(dto.itemId),
      });
      if (!menuItem) throw new NotFoundException(ResponseMessages.CART.ITEM_NOT_FOUND_MENU);
      if (!menuItem.isAvailable) throw new ConflictException(ResponseMessages.CART.ITEM_UNAVAILABLE);

      // Check for restaurant conflict
      if (cart && cart.restaurantId.toString() !== dto.restaurantId)
        throw new ConflictException(ResponseMessages.CART.RESTAURANT_CONFLICT);

      // Calculate distance and delivery charges
      const { latitude = CartConstants.DEFAULT_LAT, longitude = CartConstants.DEFAULT_LON } = JSON.parse(
        (await this.redisClient.get(`address:${userId}:coordinates`)) ?? '{}',
      );
      const [restLon, restLat] = restaurant.location.coordinates;
      const distance = this.calculateDistance(latitude, longitude, restLat, restLon);
      const deliveryCharges = this.calculateDeliveryCharges(distance);

      // Update items in the cart
      let items = cart ? cart.items : [];
      const idx = items.findIndex((i) => i.itemId.toString() === dto.itemId);

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
      const updated = await this.carts.findOneAndUpdate({ userId: userObjId }, changes, {
        upsert: true,
        returnDocument: 'after',
      });

      // Handle case where updated cart is not returned
      if (!updated || !updated.value) {
        this.logger.warn(`Cart not returned after update for user ${userId}. Fetching manually.`, CartService.name);
        cart = await this.carts.findOne({ userId: userObjId });
        if (!cart) {
          this.logger.error(`Failed to fetch cart for user ${userId} after update`, CartService.name);
          throw new InternalServerErrorException(ResponseMessages.CART.CART_UPDATE_FAILED);
        }
        return cart;
      }

      return updated.value;
    } catch (error) {
      this.logger.error(`Error in addToCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }

  /**
   * Removes or decrements the quantity of an item in the user's cart.
   *
   * Function Flow:
   * - Fetches the user's cart using the provided user ID.
   * - Checks if the item exists in the cart.
   * - Decreases the quantity of the item by 1.
   *   - If quantity becomes zero, removes the item entirely from the cart.
   * - If the cart becomes empty (no items left), deletes the entire cart from the database.
   * - Otherwise, recalculates the cart totals (item total, tax, total, etc.).
   * - Updates the cart in the database with new item list and totals.
   * - Handles fallback if cart update does not return the updated document.
   *
   * @param userId - The ID of the user performing the removal operation.
   * @param dto - Data Transfer Object containing the itemId to be removed or decremented.
   * @returns The updated cart object or a message indicating cart deletion if empty.
   * @throws NotFoundException if the cart or item is not found.
   * @throws InternalServerErrorException if cart update fails unexpectedly.
   */
  async removeItemService(userId: string, dto: RemoveItemDto) {
    try {
      this.logger.log(`Removing item ${dto.itemId} for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);

      // fetch the cart
      const cart = await this.carts.findOne({ userId: userObjId });
      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_NOT_FOUND);

      // find item in the cart
      const idx = cart.items.findIndex((i) => i.itemId.toString() === dto.itemId);
      if (idx === -1) throw new NotFoundException(ResponseMessages.CART.ITEM_NOT_FOUND);

      const items = cart.items;
      const item = items[idx];
      item.quantity -= 1;

      // Remove item if quantity is zero
      if (item.quantity <= 0) {
        items.splice(idx, 1);
      } else {
        item.tax = this.calculateTax(item.price * item.quantity);
      }

      // delete cart if no items are left
      if (items.length === 0) {
        await this.carts.deleteOne({ _id: cart._id });
        this.logger.warn(`Cart emptied and deleted for user ${userId}`, CartService.name);
        return { message: ResponseMessages.CART.CART_DELETED };
      }

      // calculating totals
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
          throw new InternalServerErrorException(ResponseMessages.CART.CART_UPDATE_FAILED);
        }
        return updatedCart;
      }

      return updated.value;
    } catch (error) {
      this.logger.error(`Error in removeItemService: ${error.message}`, CartService.name);
      throw error;
    }
  }

  /**
   * Retrieves the current cart for a user and ensures it contains only valid, up-to-date items.
   *
   * Function Responsibilities:
   * - Fetches the cart associated with the given userId from the database.
   * - For each item in the cart:
   *   - Checks if the item still exists and is available in the menu.
   *   - Verifies and updates the item price if it has changed.
   *   - Recalculates tax for each valid item.
   * - Filters out invalid or unavailable items.
   *
   * Behavior:
   * - If no valid items remain, marks the cart as empty and updates it accordingly.
   * - If any updates were made (invalid items removed or price changes), updates the cart in the DB with new totals.
   * - If no changes are needed, returns the existing cart.
   *
   * @param userId - The ID of the user whose cart is being fetched.
   * @returns An object containing the latest cart or null if the cart is empty, along with a message.
   * @throws NotFoundException - If the cart is not found in the database.
   * @throws InternalServerErrorException - If any operation fails unexpectedly.
   */

  async getCartService(userId: string) {
    try {
      this.logger.verbose(`Fetching cart for user ${userId}`, CartService.name);
      const userObjId = new ObjectId(userId);

      let cart = await this.carts.findOne({ userId: userObjId });
      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_FETCH_FAIL);

      let updated = false;

      const items = await Promise.all(
        cart.items.map(async (item) => {
          const menuItem = await this.menuItems.findOne({ _id: item.itemId });

          if (!menuItem || !menuItem.isAvailable) {
            updated = true;
            return null; // Item is no longer valid
          }

          if (item.price !== menuItem.price) {
            updated = true;
            item.price = menuItem.price;
          }

          item.tax = this.calculateTax(item.price * item.quantity);

          return item;
        }),
      );

      const validItems = items.filter(Boolean);

      // If no valid items are left, mark cart as empty
      if (validItems.length === 0) {
        await this.carts.deleteOne({ userId: userObjId });

        return {
          cart: null,
          message: 'Your cart has been deleted as all items are unavailable or removed.',
        };
      }

      // If anything was updated (price or removed), save changes
      if (updated) {
        const totals = this.calculateCartTotals(validItems, cart.deliveryCharges, cart.discount || 0);

        const result = await this.carts.findOneAndUpdate(
          { userId: userObjId },
          {
            $set: {
              items: validItems,
              ...totals,
            },
          },
          { returnDocument: 'after' },
        );

        return {
          cart: result?.value,
          message: 'Cart updated with latest prices, availability, taxes, and totals',
        };
      }

      return {
        cart,
        message: 'Cart is up to date',
      };
    } catch (error) {
      this.logger.error(`Error in getCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }

  /**
   * Applies a valid coupon to the user's cart and updates the total after discount.
   *
   * Function Responsibilities:
   * - Fetches the user's cart from the database.
   * - Ensures a coupon isn't already applied to the cart.
   * - Fetches and validates the coupon:
   *   - Checks if the coupon exists, is active, and not expired.
   *   - Checks if the coupon is valid for the restaurant associated with the cart.
   *   - Ensures the cart total meets the coupon’s minimum order amount.
   * - Calculates the discount (based on the coupon's percentage and max cap).
   * - Updates the cart with:
   *   - New discounted total
   *   - Discount amount
   *   - Coupon code and ID
   *
   * @param userId - The ID of the user applying the coupon.
   * @param couponId - The ID of the coupon being applied.
   * @returns An object with a success message, new total, discount applied, and coupon code.
   * @throws NotFoundException - If the cart or coupon is not found.
   * @throws BadRequestException - If a coupon is already applied, expired, invalid for the cart, or order total is too low.
   */
  async applyCouponService(userId: string, couponDto: CouponDto) {
    try {
      const { couponId } = couponDto;
      this.logger.log(`Applying coupon ${couponId} to user ${userId}`, CartService.name);

      const userObjId = new ObjectId(userId);
      const cart = await this.carts.findOne({ userId: userObjId });

      if (!cart) throw new NotFoundException(ResponseMessages.CART.CART_NOT_FOUND);

      // Check if a coupon is already applied
      if (cart.couponId) {
        throw new BadRequestException('A coupon has already been applied to this cart.');
      }

      const coupon = await this.coupons.findOne({
        _id: new ObjectId(couponId),
      });
      if (!coupon) throw new NotFoundException(ResponseMessages.COUPON.COUPON_NOT_FOUND);

      if (coupon.restaurantId && coupon.restaurantId.toString() !== cart.restaurantId.toString()) {
        throw new BadRequestException(ResponseMessages.COUPON.INVALID_COUPON);
      }

      if (!coupon.isActive || coupon.expiryDate < new Date()) {
        throw new BadRequestException(ResponseMessages.COUPON.COUPON_EXPIRED);
      }

      if (cart.total < coupon.minOrderAmount) {
        throw new BadRequestException(ResponseMessages.COUPON.COUPON_MIN_AMOUNT(coupon.minOrderAmount));
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

  /**
   * Retrieves all available coupons for a specific restaurant.
   *
   * Function Responsibilities:
   * - Logs the coupon retrieval operation for debugging purposes.
   * - Queries the `coupons` collection to find all coupons that match the given restaurant ID.
   * - Converts the query result to an array.
   * - Throws an error if no coupons are found.
   *
   * @param restaurantId - The ID of the restaurant for which coupons are being fetched.
   * @returns An array of coupon documents associated with the restaurant.
   * @throws NotFoundException - If no coupons are found for the given restaurant.
   * @throws InternalServerErrorException - If an unexpected error occurs during the operation.
   */
  async viewCouponsService(restaurantDto: RestaurantDto) {
    try {
      const { restaurantId } = restaurantDto; // Extract restaurantId from the DTO
      this.logger.debug(`Fetching coupons for restaurant ${restaurantId}`, CartService.name);
      const coupons = await this.coupons.find({ restaurantId: new ObjectId(restaurantId) }).toArray();
      console.log(coupons);

      if (!coupons.length) throw new NotFoundException(ResponseMessages.COUPON.NO_COUPONS);

      return coupons;
    } catch (error) {
      this.logger.error(`Error in viewCouponsService: ${error.message}`, CartService.name);
      throw error;
    }
  }

  /**
   * Deletes the cart associated with a user after an order is successfully created.
   *
   * This method is triggered automatically by the `orderCreated` Kafka event.
   *
   * Function Responsibilities:
   * - Logs the start of the cart deletion process for a given user.
   * - Attempts to delete the user's cart from the database based on their `userId`.
   * - Logs a warning if no cart was found to delete.
   * - Logs a success message if the cart was successfully deleted.
   *
   * @param userId - The ID of the user whose cart should be deleted after order placement.
   * @returns void
   * @throws Error - If an unexpected error occurs during the cart deletion process.
   */
  @EventPattern('orderCreated')
  async deleteCartService(userId: string) {
    try {
      this.logger.warn(`Deleting cart for user ${userId}`, CartService.name);
      const result = await this.carts.deleteOne({
        userId: new ObjectId(userId),
      });
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

  /**
   * Removes an applied coupon from the user's cart and recalculates the total.
   *
   * Function Responsibilities:
   * - Logs the start of the coupon removal process.
   * - Retrieves the user's cart from the database using the user ID.
   * - Checks whether the cart exists; throws a NotFoundException if not found.
   * - Checks if a coupon is currently applied to the cart; throws a BadRequestException if not.
   * - Restores the original total by adding back the previously applied discount.
   * - Updates the cart in the database by:
   *   - Removing the coupon ID and coupon code
   *   - Resetting the discount to zero
   *   - Setting the new total
   * - Logs successful coupon removal.
   * - Returns a message confirming coupon removal along with the new total and discount removed.
   *
   * @param userId - The ID of the user whose cart's coupon should be removed.
   * @returns An object containing a success message, the updated total, and the discount that was removed.
   * @throws NotFoundException - If the user's cart does not exist.
   * @throws BadRequestException - If no coupon is applied to the cart.
   * @throws Error - If any unexpected error occurs during the operation.
   */
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

  /**
   * Updates or creates the user's cart with the latest items, quantities, and pricing.
   *
   * Steps:
   * - Fetches user's address coordinates from Redis.
   * - Calculates distance and delivery charges from the restaurant.
   * - Validates each item (availability, existence, price).
   * - Removes items with zero quantity.
   * - If no items remain, deletes the cart.
   * - Calculates new totals and taxes.
   * - Updates or creates the cart in the database using MongoDB's `findOneAndUpdate`.
   *
   * @param userId - The ID of the user whose cart is being updated.
   * @param dto - Data Transfer Object containing restaurantId and an array of items.
   * @returns A message and the updated cart object, or null if the cart is deleted.
   * @throws NotFoundException | ConflictException | InternalServerErrorException
   */
  async updateCartService(userId: string, dto: MultipleItemDto) {
    try {
      const userObjId = new ObjectId(userId);

      // Fetch user coordinates
      const { latitude = CartConstants.DEFAULT_LAT, longitude = CartConstants.DEFAULT_LON } = JSON.parse(
        (await this.redisClient.get(`address:${userId}:coordinates`)) ?? '{}',
      );

      // Fetch and validate restaurant
      const restaurant = await this.restaurants.findOne({
        _id: new ObjectId(dto.restaurantId),
      });
      if (!restaurant) throw new NotFoundException(ResponseMessages.CART.RESTAURANT_NOT_FOUND);

      const [restLon, restLat] = restaurant.location.coordinates;
      const distance = this.calculateDistance(latitude, longitude, restLat, restLon);
      const deliveryCharges = this.calculateDeliveryCharges(distance);

      // Fetch current cart
      let cart = await this.carts.findOne({ userId: userObjId });

      if (cart && cart.restaurantId.toString() !== dto.restaurantId) {
        throw new ConflictException(ResponseMessages.CART.RESTAURANT_CONFLICT);
      }

      let items: any[] = [];

      for (const inputItem of dto.items) {
        const menuItem = await this.menuItems.findOne({
          _id: new ObjectId(inputItem.itemId),
        });

        if (!menuItem) throw new NotFoundException(`Item with ID ${inputItem.itemId} not found`);
        if (!menuItem.isAvailable) throw new ConflictException(`Item ${menuItem.name} is unavailable`);

        if (inputItem.quantity <= 0) {
          continue; // Skip adding item with 0 quantity
        }

        items.push({
          itemId: new ObjectId(inputItem.itemId),
          name: menuItem.name,
          quantity: inputItem.quantity,
          price: menuItem.price,
          tax: this.calculateTax(menuItem.price * inputItem.quantity),
        });
      }

      // If no items are left after filtering → delete cart
      if (items.length === 0) {
        await this.carts.deleteOne({ userId: userObjId });
        this.logger.warn(`Cart deleted for user ${userId} as all items had zero quantity`, CartService.name);
        return {
          message: 'Cart is empty and has been deleted',
          cart: null,
        };
      }

      // Calculate totals using helper
      const totals = this.calculateCartTotals(items, deliveryCharges, cart?.discount || 0);

      // Update or create cart
      const updated = await this.carts.findOneAndUpdate(
        { userId: userObjId },
        {
          $set: {
            userId: userObjId,
            restaurantId: new ObjectId(dto.restaurantId),
            items,
            deliveryCharges,
            distanceInKm: parseFloat(distance.toFixed(2)),
            ...totals,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      // Handle case where updated cart is not returned
      if (!updated) {
        this.logger.error(`Failed to update or create cart for user ${userId}`, CartService.name);
        throw new InternalServerErrorException('Failed to update or create cart');
      }

      return {
        message: 'Cart updated successfully',
        cart: updated,
      };
    } catch (error) {
      this.logger.error(`Error in updateCartService: ${error.message}`, CartService.name);
      throw error;
    }
  }

  // -----------------------
  // Helper Methods Below
  // -----------------------

  /**
   * Converts degrees to radians.
   *
   * This utility is used in geographical calculations like distance between
   * two coordinates using the Haversine formula, which requires angles in radians.
   *
   * @param value - The angle in degrees.
   * @returns The angle converted to radians.
   */
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Calculates the great-circle distance between two geographical coordinates using the Haversine formula.
   *
   * The Haversine formula determines the shortest distance over the Earth's surface between two latitude/longitude points.
   * This method is useful for delivery services, mapping features, or geolocation-based charges.
   *
   * @param lat1 - Latitude of the first location in degrees.
   * @param lon1 - Longitude of the first location in degrees.
   * @param lat2 - Latitude of the second location in degrees.
   * @param lon2 - Longitude of the second location in degrees.
   * @returns The distance between the two coordinates in kilometers.
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    // Haversine formula
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculates delivery charges based on the distance between the user and the restaurant.
   *
   * Multiplies the distance (in kilometers) by a constant per-kilometer delivery rate,
   * then rounds up to the nearest whole number using Math.ceil to avoid fractional charges.
   *
   * @param distance - The distance between user and restaurant in kilometers.
   * @returns The delivery charge in whole currency units.
   */
  private calculateDeliveryCharges(distance: number): number {
    return Math.ceil(distance * CartConstants.DELIVERY_CHARGE_PER_KM);
  }

  /**
   * Calculates tax for a given amount based on a predefined tax percentage.
   *
   * The tax percentage is retrieved from CartConstants.TAX_PERCENT and applied to the provided amount.
   * This function assumes the tax is a percentage of the total item or subtotal value.
   *
   * @param amount - The base amount on which tax is to be calculated.
   * @returns The calculated tax as a numeric value.
   */
  private calculateTax(amount: number): number {
    return (amount * CartConstants.TAX_PERCENT) / 100;
  }

  /**
   * Calculates and returns a breakdown of the cart totals including item total, tax, platform fee, and final total.
   *
   * - Computes the total price of all items by multiplying each item's price by its quantity.
   * - Applies tax to the item total using the calculateTax helper method.
   * - Adds delivery charges and a fixed platform fee (from CartConstants).
   * - Subtracts any applied discount.
   * - The final total is rounded to the nearest whole number for currency consistency.
   *
   * @param items - An array of cart items, each containing price and quantity.
   * @param deliveryCharges - The calculated delivery cost to be added to the cart total.
   * @param discount - Optional discount value to subtract from the final total (defaults to 0).
   * @returns An object containing itemTotal, subtotal, tax, total, and platformFee.
   */
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
}
