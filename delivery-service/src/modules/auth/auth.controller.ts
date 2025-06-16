
import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { ForgetPasswordGuard } from './guards/forgetPasswordGuard';
import { AuthGuard } from './guards/authGuard';
import { CurrentPartner } from 'src/common/decorators';
import { Types } from 'mongoose';
import { OtpVerifiedGuard } from './guards/otpVerifiedGuard';
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
import { Logger } from '@nestjs/common';
import { AUTH_CONSTANTS } from './authConstants';


@ApiTags('Auth - Delivery Partner')
@Controller(AUTH_CONSTANTS.ENDPOINTS.AUTH_DELIVERY_PARTNER)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post(AUTH_CONSTANTS.ENDPOINTS.REGISTER)
  @ApiOperation({ 
    summary: 'Register a new delivery partner',
    description: 'Creates a new delivery partner account with the provided details.'
  })
  @ApiBody({ 
    type: RegisterPartnerDto,
    description: 'Delivery partner registration data'
  })
  @ApiCreatedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER,
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST,
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiConflictResponse({
    description: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS,
    schema: {
      example: {
        statusCode: 409,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.CONFLICT
      }
    }
  })
  async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
    this.logger.log('Registering new delivery partner');
    const result = await this.authService.register(createDeliveryPartnerData);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER);
    return result;
  }

  @Post(AUTH_CONSTANTS.ENDPOINTS.LOGIN)
  @ApiOperation({ 
    summary: 'Login a delivery partner',
    description: 'Authenticates a delivery partner and returns JWT tokens.'
  })
  @ApiBody({ 
    type: LoginPartnerDto,
    description: 'Delivery partner login credentials'
  })
  @ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN,
        accessToken: 'jwt.token.here',
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST,
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  async login(@Body() credentials: LoginPartnerDto) {
    this.logger.log('Attempting partner login');
    const result = await this.authService.login(credentials);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN);
    return result;
  }

  @UseGuards(AuthGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.LOGOUT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Logout a delivery partner',
    description: 'Invalidates the current session token.'
  })
  @ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  async logout(@CurrentPartner() partnerId: Types.ObjectId) {
    this.logger.log(`Logging out partner: ${partnerId}`);
    await this.authService.logout(partnerId);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT);
    return { success: true, message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT };
  }

  @UseGuards(AuthGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.CHANGE_PASSWORD)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Change password for authenticated delivery partner',
    description: 'Allows an authenticated partner to change their password.'
  })
  @ApiBody({ 
    type: ChangePasswordDto,
    description: 'Current and new password details'
  })
  @ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CURRENT_PASSWORD,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_CURRENT_PASSWORD,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  async changePassword(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body() changePasswordData: ChangePasswordDto,
  ) {
    this.logger.log(`Changing password for partner: ${partnerId}`);
    const result = await this.authService.changePassword(partnerId, changePasswordData);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD);
    return result;
  }

  @Post(AUTH_CONSTANTS.ENDPOINTS.FORGOT_PASSWORD)
  @ApiOperation({ 
    summary: 'Initiate password reset process',
    description: 'Sends an OTP to the registered email for password reset.'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email address for password reset'
  })
  @ApiOkResponse({ 
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
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_NOT_FOUND,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_NOT_FOUND,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
    this.logger.log('Initiating forgot password process');
    const result = await this.authService.forgetPassword(forgotPasswordData);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD);
    return result;
  }

  @UseGuards(ForgetPasswordGuard)
  @Post(AUTH_CONSTANTS.ENDPOINTS.RESEND_OTP)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Resend OTP for password reset',
    description: 'Resends the OTP to the email associated with the temporary token.'
  })
  @ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  async resendOtp(@CurrentPartner() partnerEmail: string) {
    this.logger.log(`Resending OTP for email: ${partnerEmail}`);
    await this.authService.sendOtp(partnerEmail);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP);
    return { success: true, message: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP };
  }

  @UseGuards(ForgetPasswordGuard)
  @Post(AUTH_CONSTANTS.ENDPOINTS.VERIFY_OTP)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Verify OTP for password reset',
    description: 'Validates the OTP sent to the email for password reset.'
  })
  @ApiBody({ 
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
  })
  @ApiOkResponse({ 
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
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_OTP,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_OTP,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string) {
    this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
    const result = await this.authService.verifyOtp(partnerEmail, otp);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP);
    return result;
  }

  @UseGuards(OtpVerifiedGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.UPDATE_PASSWORD)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Update password after OTP verification',
    description: 'Updates the password after successful OTP verification.'
  })
  @ApiBody({ 
    type: UpdatePasswordDto,
    description: 'New password details'
  })
  @ApiOkResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD,
    schema: {
      example: {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_PASSWORD_FORMAT,
    schema: {
      example: {
        statusCode: 400,
        message: AUTH_CONSTANTS.MESSAGES.ERROR.INVALID_PASSWORD_FORMAT,
        error: AUTH_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  async updatePassword(
    @CurrentPartner() partnerEmail: string,
    @Body() updatePasswordData: UpdatePasswordDto,
  ) {
    this.logger.log(`Updating password for email: ${partnerEmail}`);
    const result = await this.authService.updatePassword(partnerEmail, updatePasswordData);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD);
    return result;
  }
}