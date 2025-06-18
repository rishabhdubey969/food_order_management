export const DELIVERY_CONSTANTS = {
  ENDPOINTS: {
    DELIVERY_BASE: 'delivery',
    DELIVERED: 'delivered',
  },
  EVENTS: {
    HAND_OVERED: 'handOvered',
    NEW_ORDER: 'newOrder',
    DELIVERY_PARTNER_RESPONSE: 'deliveryPartnerResponse',
  },
  MESSAGES: {
    SUCCESS: {
      ORDER_PICKED_UP: 'Order status updated to PICKED_UP',
      ORDER_IN_TRANSIT: 'Order status updated to IN_TRANSIT',
      DELIVERY_CREATED: 'Delivery created for order',
      ORDER_DELIVERED: 'Order marked as DELIVERED',
      PARTNER_ASSIGNED: 'Delivery partner assigned successfully for order',
      DELIVERY_CREATED_SUCCESS: 'Delivery Created Successfully!!',
      PARTNER_ASSIGNED_SUCCESS: 'Partner assigned successfully to order',
      DELIVERIES_FETCHED: 'Fetched deliveries for partner',
      EARNINGS_CALCULATED: 'Earnings calculated for partner',
    },
    ERROR: {
      INVALID_ORDER_ID: 'Invalid order ID format',
      FAILED_DELIVERY_STATUS: 'Failed to update delivery status',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
      ORDER_NOT_FOUND: 'Order not found',
      BAD_REQUEST: 'Bad Request',
      UNAUTHORIZED: 'Unauthorized',
      INVALID_ORDER_ID_SERVICE: 'Invalid Order Id!!',
      NO_COORDINATES: 'No coordinates Provided!!',
      NO_DELIVERY_PARTNERS: 'No delivery partners available',
      DELIVERY_NOT_FOUND: 'Delivery Document not found',
      INVALID_PERIOD: 'Invalid period specified',
      COORDINATES_MISSING: 'Coordinates Missing!!',
    },
  },
  PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
  TIMEOUTS: {
    IN_TRANSIT_DELAY: 10 * 1000
  },
  REDIS: {
    NEAREST_DRIVER_RADIUS: 5,
    NEAREST_DRIVER_LIMIT: 10
  },
};