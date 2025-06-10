
import { Body, Controller, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { ForgetPasswordGuard } from './guards/forgetPasswordGuard';
import { AuthGuard } from './guards/authGuard';
import { CurrentPartner } from 'src/common/decorators';

@Controller('authDeliveryPartner')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

    @Post('register')
      async register(@Body() createDeliveryPartnerData: RegisterPartnerDto) {
        return await this.authService.register(createDeliveryPartnerData);
    }
  
    @Post('login')
    async login(@Body() credentials: LoginPartnerDto){
      return await this.authService.login(credentials);
    }


    @UseGuards(AuthGuard)
    @Patch('changePassword')
    async changePassword(@CurrentPartner() user: any, @Body() changePasswordData: ChangePasswordDto){
        return this.authService.changePassword(user.userId, changePasswordData);
    }

    @Post('forgetPassword')
    async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto){
        return this.authService.forgetPassword(forgotPasswordData);
    }


    @UseGuards(ForgetPasswordGuard)
    @Post('/sendOtp')
    async sendOtp(@CurrentPartner() user: any){
      await this.authService.sendOtp(user.userEmail)
    }

    @UseGuards(ForgetPasswordGuard)
    @Post('/verifyOtp')
    async verifyOtp(@CurrentPartner() userEmail: string, @Body() otp: string){
      return this.authService.verifyOtp(userEmail, otp);
    }

    @Patch('updatePassword')
    async updatePassword(@CurrentPartner() userId: string, @Body() updatePasswordData: UpdatePasswordDto){
        return this.authService.updatePassword(userId, req.email, updatePasswordData);
    }
}

