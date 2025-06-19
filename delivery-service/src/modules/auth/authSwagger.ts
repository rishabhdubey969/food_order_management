import { 
  ApiTags, 
  ApiOperation,  
  ApiBearerAuth, 
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse
} from '@nestjs/swagger';
import { AUTH_CONSTANTS } from './authConstants';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { applyDecorators } from '@nestjs/common';


export const AuthSwagger = () => ApiTags('Auth - Delivery Partner');

// Register Endpoint Decorators
export const RegisterSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Register a new delivery partner',
    description: 'Creates a new delivery partner account with the provided details.'
  }),
  ApiBody({ 
    type: RegisterPartnerDto,
    description: 'Delivery partner registration data'
  }),
  ApiCreatedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER,
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST,
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiConflictResponse({
    description: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS,
    schema: {
      example: {
        statusCode: 409,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.CONFLICT
      }
    }
  })
);

// Login Endpoint Decorators
export const LoginSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Login a delivery partner',
    description: 'Authenticates a delivery partner and returns JWT tokens.'
  }),
  ApiBody({ 
    type: LoginPartnerDto,
    description: 'Delivery partner login credentials'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN,
        accessToken: 'jwt.token.here',
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST,
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);

// Logout Endpoint Decorators
export const LogoutSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Logout a delivery partner',
    description: 'Invalidates the current session token.'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
);

// Change Password Endpoint Decorators
export const ChangePasswordSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Change password for authenticated delivery partner',
    description: 'Allows an authenticated partner to change their password.'
  }),
  ApiBody({ 
    type: ChangePasswordDto,
    description: 'Current and new password details'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CURRENT_PASSWORD,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CURRENT_PASSWORD,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);

// Forgot Password Endpoint Decorators
export const ForgotPasswordSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Initiate password reset process',
    description: 'Sends an OTP to the registered email for password reset.'
  }),
  ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email address for password reset'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
        data: {
          tempToken: 'temporary.jwt.token'
        }
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_NOT_FOUND,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_NOT_FOUND,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);

// Resend OTP Endpoint Decorators
export const ResendOtpSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Resend OTP for password reset',
    description: 'Resends the OTP to the email associated with the temporary token.'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
);

// Verify OTP Endpoint Decorators
export const VerifyOtpSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Verify OTP for password reset',
    description: 'Validates the OTP sent to the email for password reset.'
  }),
  ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        otp: { 
          type: 'string',
          example: '123456',
          description: '6-digit OTP received via email'
        } 
      },
      required: ['otp']
    }
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP,
        data: {
          verifiedToken: 'verified.jwt.token'
        }
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_OTP,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_OTP,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
);

// Update Password Endpoint Decorators
export const UpdatePasswordSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Update password after OTP verification',
    description: 'Updates the password after successful OTP verification.'
  }),
  ApiBody({ 
    type: UpdatePasswordDto,
    description: 'New password details'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_PASSWORD_FORMAT,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_PASSWORD_FORMAT,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);


export const RegisterEmailSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Initiate Registration process',
    description: 'Sends an OTP to the new email for email verify.'
  }),
  ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email address for Registration'
  }),
  ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
        data: {
          tempToken: 'temporary.jwt.token'
        }
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_FOUND,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_FOUND,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);