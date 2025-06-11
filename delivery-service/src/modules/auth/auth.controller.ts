
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { MongooseError } from 'mongoose';

@ApiTags('authDeliveryPartner')
@Controller('authDeliveryPartner')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new delivery partner' })
  @ApiBody({ type: RegisterPartnerDto })
  @ApiResponse({ status: 201, description: 'Partner registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
    this.logger.log('Registering new delivery partner');
    try {
      const result = await this.authService.register(createDeliveryPartnerData);
      this.logger.log('Partner registered successfully');
      return result;
    } catch (err) {
      this.logger.error('Error registering partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a delivery partner' })
  @ApiBody({ type: LoginPartnerDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() credentials: LoginPartnerDto) {
    this.logger.log('Attempting partner login');
    try {
      const result = await this.authService.login(credentials);
      this.logger.log('Partner logged in successfully');
      return result;
    } catch (err) {
      this.logger.error('Error logging in partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(AuthGuard)
  @Patch('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout a delivery partner' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentPartner() partnerId: Types.ObjectId) {
    this.logger.log(`Logging out partner: ${partnerId}`);
    try {
      await this.authService.logout(partnerId);
      this.logger.log('Partner logged out successfully');
    } catch (err) {
      this.logger.error('Error logging out partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(AuthGuard)
  @Patch('changePassword')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password for a delivery partner' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body() changePasswordData: ChangePasswordDto,
  ) {
    this.logger.log(`Changing password for partner: ${partnerId}`);
    try {
      const result = await this.authService.changePassword(partnerId, changePasswordData);
      this.logger.log('Password changed successfully');
      return result;
    } catch (err) {
      this.logger.error('Error changing password', err);
      throw new MongooseError(err.Message);
    }
  }

  @Post('forgetPassword')
  @ApiOperation({ summary: 'Initiate forgot password process' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto) {
    this.logger.log('Initiating forgot password process');
    try {
      const result = await this.authService.forgetPassword(forgotPasswordData);
      this.logger.log('Forgot password OTP sent');
      return result;
    } catch (err) {
      this.logger.error('Error in forgot password process', err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(ForgetPasswordGuard)
  @Post('/resendOtp')
  @ApiOperation({ summary: 'Resend OTP for forgot password' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendOtp(@CurrentPartner() user: any) {
    this.logger.log(`Resending OTP for email: ${user.userEmail}`);
    try {
      await this.authService.sendOtp(user.userEmail);
      this.logger.log('OTP resent successfully');
    } catch (err) {
      this.logger.error('Error resending OTP', err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(ForgetPasswordGuard)
  @Post('/verifyOtp')
  @ApiOperation({ summary: 'Verify OTP for forgot password' })
  @ApiBody({ schema: { type: 'object', properties: { otp: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyOtp(@CurrentPartner() partnerEmail: string, @Body('otp') otp: string) {
    this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
    try {
      const result = await this.authService.verifyOtp(partnerEmail, otp);
      this.logger.log('OTP verified successfully');
      return result;
    } catch (err) {
      this.logger.error('Error verifying OTP', err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(OtpVerifiedGuard)
  @Patch('/updatePassword')
  @ApiOperation({ summary: 'Update password after OTP verification' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePassword(
    @CurrentPartner() partnerEmail: string,
    @Body() updatePasswordData: UpdatePasswordDto,
  ) {
    this.logger.log(`Updating password for email: ${partnerEmail}`);
    try {
      const result = await this.authService.updatePassword(partnerEmail, updatePasswordData);
      this.logger.log('Password updated successfully');
      return result;
    } catch (err) {
      this.logger.error('Error updating password', err);
      throw new MongooseError(err.Message);
    }
  }
}