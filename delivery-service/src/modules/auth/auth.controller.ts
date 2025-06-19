
import { Body, Controller, Patch, Post, UseGuards, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
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
import { AUTH_CONSTANTS } from './authConstants';

import { 
  AuthSwagger,
  RegisterSwagger,
  LoginSwagger,
  LogoutSwagger,
  ChangePasswordSwagger,
  ForgotPasswordSwagger,
  ResendOtpSwagger,
  VerifyOtpSwagger,
  UpdatePasswordSwagger,
  RegisterEmailSwagger
} from './authSwagger';
import { RegisterEmailDto } from './dtos/registerEmailDto';


@AuthSwagger()
@Controller(AUTH_CONSTANTS.ENDPOINTS.AUTH_DELIVERY_PARTNER)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}



  @RegisterEmailSwagger()
  @Post('registerEmail')
  async handleRegisterEmail(@Body() registerEmailData: RegisterEmailDto){
    const { email } = registerEmailData;
    return await this.authService.handleRegisterEmail(email);
  }

  @RegisterSwagger()
  @UseGuards(OtpVerifiedGuard)
  @Post(AUTH_CONSTANTS.ENDPOINTS.REGISTER)
  async register(@CurrentPartner('sub') partnerEmail: string, @Body() createDeliveryPartnerData: RegisterPartnerDto) {
    this.logger.info('Registering new delivery partner', {
      service: 'AuthController',
      method: 'register',
      email: partnerEmail
    });

      const result = await this.authService.register(createDeliveryPartnerData, partnerEmail);
      this.logger.info('Registration successful', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.REGISTER,
        email: partnerEmail
      });
      return result;
  }

  @LoginSwagger()
  @Post(AUTH_CONSTANTS.ENDPOINTS.LOGIN)
  async login(@Body() credentials: LoginPartnerDto) {
    this.logger.info('Login attempt', {
      service: 'AuthController',
      method: 'login',
      email: credentials.email,
    });

      const result = await this.authService.login(credentials);
      this.logger.info('Login successful', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGIN,
        email: credentials.email,
      });
      return result;
  }

  @LogoutSwagger()
  @UseGuards(AuthGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.LOGOUT)
  async logout(@CurrentPartner() partnerId: Types.ObjectId) {
    this.logger.info('Logout initiated', {
      service: 'AuthController',
      method: 'logout',
      partnerId: partnerId.toString(),
    });

      await this.authService.logout(partnerId);
      this.logger.info('Logout successful', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT,
        partnerId: partnerId.toString(),
      });
      return { success: true, message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT };
  }

  @ChangePasswordSwagger()
  @UseGuards(AuthGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.CHANGE_PASSWORD)
  async changePassword(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body() changePasswordData: ChangePasswordDto,
  ) {
    this.logger.info('Password change requested', {
      service: 'AuthController',
      method: 'changePassword',
      partnerId: partnerId.toString(),
    });

      const result = await this.authService.changePassword(partnerId, changePasswordData);
      this.logger.info('Password changed successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.CHANGE_PASSWORD,
        partnerId: partnerId.toString(),
      });
      return result;
  }

  @ForgotPasswordSwagger()
  @Post(AUTH_CONSTANTS.ENDPOINTS.FORGOT_PASSWORD)
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
    this.logger.info('Forgot password initiated', {
      service: 'AuthController',
      method: 'forgotPassword',
      email: forgotPasswordData.email,
    });

      const result = await this.authService.forgetPassword(forgotPasswordData);
      this.logger.info('Forgot password email sent', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
        email: forgotPasswordData.email,
      });
      return result;
  }


  @ResendOtpSwagger()
  @UseGuards(ForgetPasswordGuard)
  @Post(AUTH_CONSTANTS.ENDPOINTS.RESEND_OTP)
  async resendOtp(@CurrentPartner() partnerEmail: string) {
    this.logger.info('OTP resend requested', {
      service: 'AuthController',
      method: 'resendOtp',
      email: partnerEmail,
    });

      await this.authService.sendOtp(partnerEmail);
      this.logger.info('OTP resent successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP,
        email: partnerEmail,
      });
      return { success: true, message: AUTH_CONSTANTS.MESSAGES.SUCCESS.RESEND_OTP };
  }


  @VerifyOtpSwagger()
  @UseGuards(ForgetPasswordGuard)
  @Post(AUTH_CONSTANTS.ENDPOINTS.VERIFY_OTP)
  async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string) {
    this.logger.info('OTP verification initiated', {
      service: 'AuthController',
      method: 'verifyOtp',
      email: partnerEmail,
    });

  
      const result = await this.authService.verifyOtp(partnerEmail, otp);
      this.logger.info('OTP verified successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP,
        email: partnerEmail,
      });
      return result;
  }

  @UpdatePasswordSwagger()
  @UseGuards(OtpVerifiedGuard)
  @Patch(AUTH_CONSTANTS.ENDPOINTS.UPDATE_PASSWORD)
  async updatePassword(
    @CurrentPartner() partnerEmail: string,
    @Body() updatePasswordData: UpdatePasswordDto,
  ) {
    this.logger.info('Password update initiated', {
      service: 'AuthController',
      method: 'updatePassword',
      email: partnerEmail,
    });

      const result = await this.authService.updatePassword(partnerEmail, updatePasswordData);
      this.logger.info('Password updated successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.UPDATE_PASSWORD,
        email: partnerEmail,
      });
      return result;
  }
}