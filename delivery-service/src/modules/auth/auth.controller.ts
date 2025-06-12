
// import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { RegisterPartnerDto } from './dtos/registerPartnerDto';
// import { LoginPartnerDto } from './dtos/loginPartnerDto';
// import { ChangePasswordDto } from './dtos/changePasswordDto';
// import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
// import { UpdatePasswordDto } from './dtos/updatePasswordDto';
// import { ForgetPasswordGuard } from './guards/forgetPasswordGuard';
// import { AuthGuard } from './guards/authGuard';
// import { CurrentPartner } from 'src/common/decorators';
// import { Types } from 'mongoose';
// import { OtpVerifiedGuard } from './guards/otpVerifiedGuard';



// @Controller('authDeliveryPartner')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//     @Post('register')
//       async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
//         return await this.authService.register(createDeliveryPartnerData);
//     }
  
//     @Post('login')
//     async login(@Body() credentials: LoginPartnerDto){
//       return await this.authService.login(credentials);
//     }

//     @UseGuards(AuthGuard)
//     @Patch('logout')
//     async logout(@CurrentPartner() partnerId: Types.ObjectId){
//       await this.authService.logout(partnerId);
//     }

//     @UseGuards(AuthGuard)
//     @Patch('changePassword')
//     async changePassword(@CurrentPartner() partnerId: Types.ObjectId, @Body() changePasswordData: ChangePasswordDto){
//         return this.authService.changePassword(partnerId, changePasswordData);
//     }

//     @Post('forgetPassword')
//     async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto){
//         return this.authService.forgetPassword(forgotPasswordData);
//     }

//     @UseGuards(ForgetPasswordGuard)
//     @Post('/resendOtp')
//     async sendOtp(@CurrentPartner() user: any){
//       await this.authService.sendOtp(user.userEmail)
//     }

//     @UseGuards(ForgetPasswordGuard)
//     @Post('/verifyOtp')
//     async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string){
//       return this.authService.verifyOtp(partnerEmail, otp);
//     }

//     @UseGuards(OtpVerifiedGuard)
//     @Patch('/updatePassword')
//     async updatePassword(@CurrentPartner() partnerEmail: string, @Body() updatePasswordData: UpdatePasswordDto){
//         return this.authService.updatePassword(partnerEmail, updatePasswordData);
//     }
// }


// import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { RegisterPartnerDto } from './dtos/registerPartnerDto';
// import { LoginPartnerDto } from './dtos/loginPartnerDto';
// import { ChangePasswordDto } from './dtos/changePasswordDto';
// import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
// import { UpdatePasswordDto } from './dtos/updatePasswordDto';
// import { ForgetPasswordGuard } from './guards/forgetPasswordGuard';
// import { AuthGuard } from './guards/authGuard';
// import { CurrentPartner } from 'src/common/decorators';
// import { Types } from 'mongoose';
// import { OtpVerifiedGuard } from './guards/otpVerifiedGuard';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
// import { Logger } from '@nestjs/common';
// import { MongooseError } from 'mongoose';

// @ApiTags('authDeliveryPartner')
// @Controller('authDeliveryPartner')
// export class AuthController {
//   private readonly logger = new Logger(AuthController.name);

//   constructor(private readonly authService: AuthService) {}

//   @Post('register')
//   @ApiOperation({ summary: 'Register a new delivery partner' })
//   @ApiBody({ type: RegisterPartnerDto })
//   @ApiResponse({ status: 201, description: 'Partner registered successfully' })
//   @ApiResponse({ status: 400, description: 'Invalid input data' })
//   async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
//     this.logger.log('Registering new delivery partner');
//     const result = await this.authService.register(createDeliveryPartnerData);
//     this.logger.log('Partner registered successfully');
//     return result;
//   }

//   @Post('login')
//   @ApiOperation({ summary: 'Login a delivery partner' })
//   @ApiBody({ type: LoginPartnerDto })
//   @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
//   @ApiResponse({ status: 401, description: 'Invalid credentials' })
//   async login(@Body() credentials: LoginPartnerDto) {
//     this.logger.log('Attempting partner login');
//     const result = await this.authService.login(credentials);
//     this.logger.log('Partner logged in successfully');
//     return result;
//   }

//   @UseGuards(AuthGuard)
//   @Patch('logout')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Logout a delivery partner' })
//   @ApiResponse({ status: 200, description: 'Logout successful' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   async logout(@CurrentPartner() partnerId: Types.ObjectId) {
//     this.logger.log(`Logging out partner: ${partnerId}`);
//     await this.authService.logout(partnerId);
//     this.logger.log('Partner logged out successfully');
//   }

//   @UseGuards(AuthGuard)
//   @Patch('changePassword')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Change password for a delivery partner' })
//   @ApiBody({ type: ChangePasswordDto })
//   @ApiResponse({ status: 200, description: 'Password changed successfully' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   async changePassword(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Body() changePasswordData: ChangePasswordDto,
//   ) {
//     this.logger.log(`Changing password for partner: ${partnerId}`);
//     const result = await this.authService.changePassword(partnerId, changePasswordData);
//     this.logger.log('Password changed successfully');
//     return result;
//   }

//   @Post('forgetPassword')
//   @ApiOperation({ summary: 'Initiate forgot password process' })
//   @ApiBody({ type: ForgotPasswordDto })
//   @ApiResponse({ status: 200, description: 'OTP sent to email' })
//   @ApiResponse({ status: 400, description: 'Invalid email' })
//   async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
//     this.logger.log('Initiating forgot password process');

//     const result = await this.authService.forgetPassword(forgotPasswordData);
//     this.logger.log('Forgot password OTP sent');
//     return result;
//   }

//   @UseGuards(ForgetPasswordGuard)
//   @Post('/resendOtp')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Resend OTP for forgot password' })
//   @ApiResponse({ status: 200, description: 'OTP resent successfully' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   async sendOtp(@CurrentPartner() user: any) {
//     this.logger.log(`Resending OTP for email: ${user.userEmail}`);
//     await this.authService.sendOtp(user.userEmail);
//     this.logger.log('OTP resent successfully');
//   }

//   @UseGuards(ForgetPasswordGuard)
//   @Post('/verifyOtp')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Verify OTP for forgot password' })
//   @ApiBody({ schema: { type: 'object', properties: { otp: { type: 'string' } } } })
//   @ApiResponse({ status: 200, description: 'OTP verified successfully' })
//   @ApiResponse({ status: 400, description: 'Invalid OTP' })
//   async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string) {
//     this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
//     const result = await this.authService.verifyOtp(partnerEmail, otp);
//     this.logger.log('OTP verified successfully');
//     return result;
//   }

//   @UseGuards(OtpVerifiedGuard)
//   @Patch('/updatePassword')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Update password after OTP verification' })
//   @ApiBody({ type: UpdatePasswordDto })
//   @ApiResponse({ status: 200, description: 'Password updated successfully' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   async updatePassword(
//     @CurrentPartner() partnerEmail: string,
//     @Body() updatePasswordData: UpdatePasswordDto,
//   ) {
//     this.logger.log(`Updating password for email: ${partnerEmail}`);
//     const result = await this.authService.updatePassword(partnerEmail, updatePasswordData);
//     this.logger.log('Password updated successfully');
//     return result;
//   }
// }

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
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse
} from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@ApiTags('Auth - Delivery Partner')
@Controller('auth/delivery-partner')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new delivery partner',
    description: 'Creates a new delivery partner account with the provided details.'
  })
  @ApiBody({ 
    type: RegisterPartnerDto,
    description: 'Delivery partner registration data'
  })
  @ApiCreatedResponse({ 
    description: 'Partner registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Partner registered successfully',
        data: {
          accessToken: 'jwt.token.here',
          partner: {
            _id: '507f1f77bcf86cd799439011',
            email: 'partner@example.com',
            name: 'John Doe'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data or validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: 'Bad Request'
      }
    }
  })
  @ApiConflictResponse({
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict'
      }
    }
  })
  async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
    this.logger.log('Registering new delivery partner');
    const result = await this.authService.register(createDeliveryPartnerData);
    this.logger.log('Partner registered successfully');
    return result;
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Login a delivery partner',
    description: 'Authenticates a delivery partner and returns JWT tokens.'
  })
  @ApiBody({ 
    type: LoginPartnerDto,
    description: 'Delivery partner login credentials'
  })
  @ApiOkResponse({ 
    description: 'Login successful, returns JWT token',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'jwt.token.here',
          partner: {
            _id: '507f1f77bcf86cd799439011',
            email: 'partner@example.com',
            name: 'John Doe'
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email'],
        error: 'Bad Request'
      }
    }
  })
  async login(@Body() credentials: LoginPartnerDto) {
    this.logger.log('Attempting partner login');
    const result = await this.authService.login(credentials);
    this.logger.log('Partner logged in successfully');
    return result;
  }

  @UseGuards(AuthGuard)
  @Patch('logout')
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Logout a delivery partner',
    description: 'Invalidates the current session token.'
  })
  @ApiOkResponse({ 
    description: 'Logout successful',
    schema: {
      example: {
        success: true,
        message: 'Logout successful'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async logout(@CurrentPartner() partnerId: Types.ObjectId) {
    this.logger.log(`Logging out partner: ${partnerId}`);
    await this.authService.logout(partnerId);
    this.logger.log('Partner logged out successfully');
    return { success: true, message: 'Logout successful' };
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
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
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid current password or validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Current password is incorrect',
        error: 'Bad Request'
      }
    }
  })
  async changePassword(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body() changePasswordData: ChangePasswordDto,
  ) {
    this.logger.log(`Changing password for partner: ${partnerId}`);
    const result = await this.authService.changePassword(partnerId, changePasswordData);
    this.logger.log('Password changed successfully');
    return result;
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Initiate password reset process',
    description: 'Sends an OTP to the registered email for password reset.'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email address for password reset'
  })
  @ApiOkResponse({ 
    description: 'OTP sent to email',
    schema: {
      example: {
        success: true,
        message: 'OTP sent to email',
        data: {
          tempToken: 'temporary.jwt.token'
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid email or email not registered',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email not found',
        error: 'Bad Request'
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
    this.logger.log('Initiating forgot password process');
    const result = await this.authService.forgetPassword(forgotPasswordData);
    this.logger.log('Forgot password OTP sent');
    return result;
  }

  @UseGuards(ForgetPasswordGuard)
  @Post('resend-otp')
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Resend OTP for password reset',
    description: 'Resends the OTP to the email associated with the temporary token.'
  })
  @ApiOkResponse({ 
    description: 'OTP resent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP resent successfully'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or expired temporary token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async resendOtp(@CurrentPartner() partnerEmail: string) {
    this.logger.log(`Resending OTP for email: ${partnerEmail}`);
    await this.authService.sendOtp(partnerEmail);
    this.logger.log('OTP resent successfully');
    return { success: true, message: 'OTP resent successfully' };
  }

  @UseGuards(ForgetPasswordGuard)
  @Post('verify-otp')
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
    description: 'OTP verified successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP verified successfully',
        data: {
          verifiedToken: 'verified.jwt.token'
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid or expired OTP',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid OTP',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or expired temporary token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string) {
    this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
    const result = await this.authService.verifyOtp(partnerEmail, otp);
    this.logger.log('OTP verified successfully');
    return result;
  }

  @UseGuards(OtpVerifiedGuard)
  @Patch('update-password')
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
    description: 'Password updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Password updated successfully'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or expired verified token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Password validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: ['Password must be at least 8 characters'],
        error: 'Bad Request'
      }
    }
  })
  async updatePassword(
    @CurrentPartner() partnerEmail: string,
    @Body() updatePasswordData: UpdatePasswordDto,
  ) {
    this.logger.log(`Updating password for email: ${partnerEmail}`);
    const result = await this.authService.updatePassword(partnerEmail, updatePasswordData);
    this.logger.log('Password updated successfully');
    return result;
  }
}