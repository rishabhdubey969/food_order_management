export const AUTH = {
  NOT_FOUND: 'Data not found',
  USER_NOT_FOUND: 'User not found',
  SUCCESS_SIGNUP: 'Congratulations, you’ve successfully signed up!',
  USER_MATCH: 'User already exists with this email',

  Failed_RESET_LINK: 'Failed to send reset link',
  SENT_REST_LINK: 'Reset link sent',
  PASSWORD_SUCCESS: 'Password updated Successfully',
  FAILED_REST_PASSWORD: 'Failed to reset password',

  OTP_SENT: 'OTP sent successfully',
  OTP_FAILED: 'Failed user signup otp!',
};

export const RABBIT_MQ = {
  NOTIFICATION_SERVICE:'NOTIFICATION_SERVICE',
  USER_CREATED: 'user_created',
  REST_LINK: 'reset_link',
}

export const WINSTON_LOGGER_CONST = {
  SEND_OTP: 'Sending OTP to user',
  SIGNUP_OTP:'signup_otp',
  ERROR_SEND_OTP: 'Error sending OTP',
  SIGNUP_START: 'Signup User Start',

  SIGNUP_SUCCESS: 'Signup User create success',
  SIGNUP_ERROR: 'User signup error',
  FORGET_PASSWORD_ERROR: 'Error in forgotPassword',
  EXPIRE_INVALID: 'Invalid or expired token',

  RESET_PASSWORD: 'Error in resetPassword',
  UPDATE_PASSWORD_ERROR: 'Error updating password',

}