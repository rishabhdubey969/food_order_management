export const CONSTANTS = {
    // Error Messages
    ERROR_MESSAGES: {
      USER_NOT_FOUND: 'User not found.',
      INVALID_CREDENTIALS: 'Invalid credentials provided.',
      TOKEN_EXPIRED: 'Token has expired.',
      VALID_TOKEN:'token is valid',
      TOKEN_INVALID: 'Invalid token.',
      INVALID_REFRESH_TOKEN: 'Invalid refresh token.',
      GOOGLE_AUTH_FAILED: 'Google authentication failed.',
      GOOGLE_USER_NOT_FOUND: 'Google user not found.',
      UNAUTHORIZED: 'You are not authorized to access this resource.',
      INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later.',
      MISMATCHED:"token mismatched"
    },
  
    // Success Messages
    SUCCESS_MESSAGES: {
      USER_REGISTERED: 'User successfully registered.',
      USER_LOGGED_IN: 'User successfully logged in.',
      TOKEN_REFRESHED: 'Access token successfully refreshed.',
      GOOGLE_AUTH_SUCCESS: 'Google authentication successful.',
      PASSWORD_CHANGED: 'Password successfully changed.',
    },
  
    // JWT-related Constants
    JWT_CONSTANTS: {
      ACCESS_TOKEN_EXPIRES_IN: '15m', // Access token expires in 15 minutes
      REFRESH_TOKEN_EXPIRES_IN: '7d', // Refresh token expires in 7 days
      JWT_SECRET: 'your_jwt_secret_key', // Should be a secure key, ideally stored in environment variables
    },
  
    // User Roles
    ROLES: {
      USER: 'user',
      ADMIN: 'admin',
    },
  
    // Google OAuth Constants
    GOOGLE_AUTH_CONSTANTS: {
      CLIENT_ID: 'your_google_client_id', // Replace with your Google OAuth Client ID
      CLIENT_SECRET: 'your_google_client_secret', // Replace with your Google OAuth Client Secret
      CALLBACK_URL: 'http://localhost:3000/auth/google/redirect', // Google OAuth redirect URL
    },
  
    // Common Response Format
    RESPONSE_MESSAGES: {
      SUCCESS: {
        status: 'success',
        message: 'Operation completed successfully.',
      },
      ERROR: {
        status: 'error',
        message: 'An error occurred during the operation.',
      },
    },
  
    // Redis Keys and Expiry Constants
    REDIS_KEYS: {
      ACCESS_TOKEN_PREFIX: 'access:',
      REFRESH_TOKEN_PREFIX: 'refresh:',
    },
  
    REDIS_EXPIRY_TIMES: {
      ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
      REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
    },
  
    // Environment Variables (you can use these for sensitive information)
    ENV_VARIABLES: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },
  };
  