export const MESSAGES = {
  MANAGER_NOT_FOUND: 'Manager does not exist',
  MANAGER_NOT_VERIFIED: 'Manager is not verified',
  RESTAURANT_NOT_FOUND: (id: string) => `Restaurant with ID ${id} not found`,
  COUPON_NOT_FOUND: 'Coupon not found',
  UNKNOWN_ERROR: 'Something went wrong',
  MENU_ITEM_NOT_FOUND: (id: string) => `Item with ID ${id} not found`,
  NO_RESTAURANTS_FOUND_NEARBY: 'No nearby restaurants found for the provided location',
  NO_RESTAURANTS_FOUND_FOR_QUERY: (query: string) => `No restaurants found for the food keyword "${query}"`,
  MANAGER_ALREADY_VERIFIED: `Manager already have verified restaurant`
}
