export const REDIS_CONSTANTS = {
  MESSAGES: {
    SUCCESS: {
      CLIENT_INIT: 'Redis client connection attempt initiated',
      CLIENT_CONNECTED: 'Redis client connected successfully',
      CLIENT_READY: 'Redis client is ready (connected and authenticated)',
      CLIENT_CLOSED: 'Redis client connection closed gracefully',
      DATA_SET: 'Data set successfully',
      DATA_FETCHED: 'Data fetched successfully',
      DATA_DELETED: 'Data deleted successfully',
      CACHE_CLEARED: 'Redis cache cleared successfully',
      DRIVER_LOCATION_UPDATED: 'Location updated for driver',
      DRIVER_REMOVED: 'Driver removed successfully',
      DRIVER_ADDED: 'Driver added successfully',
      KEY_EXISTS_CHECKED: 'Key existence checked successfully',
      NEAREST_DRIVERS_FOUND: 'Found nearest drivers',
    },
    ERROR: {
      CLIENT_INIT_FAILED: 'Failed to initialize Redis client',
      CLIENT_NOT_READY: 'Redis client is not connected or ready',
      CLIENT_ERROR: 'Redis client error',
      CLIENT_CLOSED_UNEXPECTED: 'Redis client connection closed',
      DATA_SET_FAILED: 'Failed to set data in Redis',
      DATA_FETCH_FAILED: 'Failed to retrieve data from Redis',
      DATA_DELETE_FAILED: 'Failed to delete data from Redis',
      CACHE_CLEAR_FAILED: 'Failed to clear entire Redis cache',
      KEY_EXISTS_FAILED: 'Failed to check key existence',
      NEAREST_DRIVERS_FAILED: 'Failed to find nearest drivers',
    },
    WARN: {
      CLIENT_NOT_READY: 'Redis client not ready',
      CLIENT_ENABLED: 'Redis Client not found',
      CLIENT_ALREADY_CLOSED: 'Redis client not connected or already closed during OnModuleDestroy',
      KEY_NOT_FOUND: 'Key not found',
      NO_DRIVERS_FOUND: 'No drivers found in the specified radius',
    },
  },
  KEYS: {
    AVAILABLE_DRIVERS: 'availableDrivers',
    DRIVER_ACTIVE_PREFIX: 'driverActive:',
  },
  CONFIG: {
    HOST_KEY: 'redis.host',
    PORT_KEY: 'redis.port',
    DEFAULT_HOST: 'localhost',
    DEFAULT_PORT: 6379,
  },
  TTL: {
    DRIVER_ACTIVE: 300
  },
  GEOSPATIAL: {
    UNIT: 'km',
  },
};