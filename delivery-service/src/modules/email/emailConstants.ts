export const EMAIL_CONSTANTS = {
  MESSAGES: {
    SUCCESS: {
      TRANSPORTER_INITIALIZED: 'Nodemailer transporter initialized successfully',
      OTP_EMAIL_SENT: 'OTP email sent successfully',
    },
    ERROR: {
      MISSING_CONFIG: 'Missing email configuration. Please check environment variables for email.service, email.userEmail, and email.userPass',
      TRANSPORTER_INIT_FAILED: 'Failed to initialize email service',
      SEND_EMAIL_FAILED: 'Failed to send email. Please try again later',
    },
  },
  EMAIL: {
    SENDER_NAME: 'Foodify',
    OTP_SUBJECT: 'OTP Verification',
    OTP_TEXT_PREFIX: 'Your Foodify OTP to Verify: ',
  },
  CONFIG: {
    SERVICE_KEY: 'email.service',
    USER_EMAIL_KEY: 'email.userEmail',
    USER_PASS_KEY: 'email.userPass',
  },
};