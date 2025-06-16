export const OTP_CONSTANTS = {
  MESSAGES: {
    SUCCESS: {
      OTP_STORED: 'OTP successfully stored in Redis',
      OTP_DELETED: 'OTP successfully deleted from Redis',
      TOKEN_GENERATED: 'Access token generated with verification status',
    },
    ERROR: {
      OTP_EXPIRED_INVALID: 'OTP Expired or Invalid!',
      OTP_RETRIEVAL_FAILED: 'Failed to retrieve OTP for verification',
      OTP_VERIFICATION_FAILED: 'Failed to verify OTP',
      OTP_INVALID: 'Invalid Otp',
      TOKEN_GENERATION_FAILED: 'Failed to generate access token after OTP verification',
    },
  },
  REDIS: {
    KEY_PREFIX: 'otp-',
    EXPIRATION_MS: 5 * 60 * 1000
  },
  OTP: {
    MIN_VALUE: 100000,
    MAX_VALUE: 999999,
  },
  TOKEN: {
    EXPIRATION: '5m',
  },
};