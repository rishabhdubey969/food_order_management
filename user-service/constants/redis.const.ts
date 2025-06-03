export const REDIS = {

    USER_PROFILE: 'user_profile',
    USER_PROFILE_PREFIX: 'user_profile:',
    USER_PROFILE_TTL: 60 * 60 * 24, // 1 day in seconds
    USER_PROFILE_NOT_FOUND: 'User profile not found in cache',
    USER_PROFILE_INVALID_ID: 'Invalid user profile ID',
    USER_PROFILE_UPDATE_FAILED: 'Failed to update user profile in cache',
    USER_PROFILE_CREATED: 'User profile already exists in cache',

}

// Redis logger messages
export const REDIS_LOGGER = {

    REDIS_CONNECTED: 'Redis client connected to server.',
    REDIS_CONNECT: 'Redis client connected.',
    REDIS_ERROR: 'Redis error: ',
    REDIS_DISCONNECTED: 'Redis client disconnected.',
    REDIS_CONNECTION_SUCCESS: 'Connection to redis successfully!',
    REDIS_SET_SUCCESS: 'Redis set operation successful.',
    REDIS_GET_SUCCESS: 'Redis get operation successful.',
    REDIS_SET_FAILED: 'Redis set operation failed.',
    REDIS_GET_FAILED: 'Redis get operation failed.',
    REDIS_DISCONNECT_FAILED: 'Redis disconnect operation failed.',
    REDIS_CONNECTION_FAILED: 'Redis connection failed.',    

}