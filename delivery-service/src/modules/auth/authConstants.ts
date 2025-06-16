export const AUTH_CONSTANTS = {
  ENDPOINTS: {
    AUTH_DELIVERY_PARTNER: 'auth/deliveryPartner',
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    CHANGE_PASSWORD: 'changePassword',
    FORGOT_PASSWORD: 'forgotPassword',
    RESEND_OTP: 'resendOtp',
    VERIFY_OTP: 'verifyOtp',
    UPDATE_PASSWORD: 'updatePassword',
  },
  MESSAGES: {
    SUCCESS: {
      REGISTER: 'Partner registered successfully',
      LOGIN: 'Login successful',
      LOGOUT: 'Logout successful',
      CHANGE_PASSWORD: 'Password changed successfully',
      FORGOT_PASSWORD: 'OTP sent to email',
      SEND_OTP: 'OTP sent Successfully!!',
      RESEND_OTP: 'OTP resent successfully',
      VERIFY_OTP: 'OTP verified successfully',
      UPDATE_PASSWORD: 'Password updated successfully',
      SERVICE_REGISTER: 'Registration Successful',
      SERVICE_LOGIN: 'Login Successful!!',
      SERVICE_CHANGE_PASSWORD: 'Password Changed Successfully!!',
      SERVICE_UPDATE_PASSWORD: 'Password Resets Successfully!!!',
    },
    ERROR: {
      INVALID_CREDENTIALS: 'Invalid credentials',
      EMAIL_ALREADY_EXISTS: 'Email already exists',
      INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
      EMAIL_NOT_FOUND: 'Email not found',
      INVALID_OTP: 'Invalid OTP',
      UNAUTHORIZED: 'Unauthorized',
      BAD_REQUEST: 'Bad Request',
      CONFLICT: 'Conflict',
      INVALID_PASSWORD_FORMAT: 'Password must be at least 8 characters',
      EMAIL_OR_MOBILE_IN_USE: 'Email Or Mobile is in Use!!!',
      PARTNER_NOT_FOUND: 'Partner Not Found!!',
      INCORRECT_PASSWORD: 'Incorrect Password!!',
    },
  },
  REDIS: {
    LOGIN_KEY_PREFIX: 'login-',
    LOGIN_TOKEN_TTL: 60 * 60 * 1000
  },
  TOKEN: {
    FORGOT_PASSWORD_TOKEN_EXPIRY: '5m'
  },
};