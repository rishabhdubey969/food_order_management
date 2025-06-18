export const ResponseMessages = {
    CART: {
      CART_NOT_FOUND: 'Cart not found',
      ITEM_NOT_FOUND: 'Item not found in cart',
      CART_DELETED: 'Cart deleted because no items left',
      CART_UPDATE_FAILED: 'Failed to update cart after item removal',
      RESTAURANT_NOT_FOUND: 'Restaurant not found',
      ITEM_NOT_FOUND_MENU: 'Item not found',
      ITEM_UNAVAILABLE: 'This item is currently unavailable',
      RESTAURANT_CONFLICT: 'You already have a cart for another restaurant',
      CART_FETCH_FAIL: 'No active cart found',
      CART_PROCESSED: 'Cart processed successfully',
      CART_UPDATED: 'Cart updated for user',
    },
    COUPON: {
      COUPON_NOT_FOUND: 'Coupon not found',
      INVALID_COUPON: 'This coupon is not valid for this restaurant',
      COUPON_EXPIRED: 'Coupon is expired or inactive',
      COUPON_MIN_AMOUNT: (amount: number) =>
        `Minimum order amount should be ₹${amount}`,
      COUPON_APPLIED: 'Coupon applied successfully',
      NO_COUPONS: 'No coupons available',
    },
    GENERAL: {
      INTERNAL_ERROR: 'Something went wrong. Please try again later.',
    },
  };
  