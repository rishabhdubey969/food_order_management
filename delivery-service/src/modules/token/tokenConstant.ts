export const TOKEN_CONSTANTS = {
  MESSAGES: {
    SUCCESS: {
      HASHED: 'Data successfully hashed',
      COMPARED: 'Data comparison completed',
      JWT_SIGNED: 'JWT successfully signed',
      JWT_VERIFIED: 'JWT successfully verified',
    },
    ERROR: {
      HASH_FAILED: 'Failed to hash data',
      COMPARE_FAILED: 'Failed to compare data',
      JWT_SIGN_FAILED: 'Failed to sign JWT',
      JWT_VERIFY_FAILED: 'Failed to verify token',
      INVALID_EXPIRED_TOKEN: 'Invalid or expired token'
    }
  },
  BCRYPT: {
    SALT_ROUNDS: 10
  }
};  