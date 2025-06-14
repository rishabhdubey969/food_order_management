import { Injectable, Inject, HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model, Types } from 'mongoose';
import { Auth as AuthConst } from 'constants/auth.const';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { TokenService } from './token.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private authClient: AuthClient,
    private tokenService: TokenService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * @description Send OTP to user email
   * @param email
   * @returns
   */
  async sendOtpService(email: string) {
    try {
      this.logger.info('Sending OTP to user');
      const otp = await this.tokenService.signupOtp(email);
      const mailData = { otp, email };

      console.log(mailData);
      this.client.emit('signup_otp', mailData);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error('Error sending OTP', error);
      throw new BadRequestException('Failed to send OTP');
    }
  }

  /**
   * @description Sign up service for user registration
   * @param createAuthDto
   * @param req
   * @returns
   */
  async signUpService(createAuthDto: CreateAuthDto, req: any) {
    this.logger.info('user store start');
    const { email, password, phone, otp } = createAuthDto;
    let id: string | null = null;

    try {
      await this.tokenService.validateOtp(email, otp);
      const existingAuthenticationLogin = await this.authenticationModel
        .findOne({
          is_active: true,
          $or: [{ email: email }, { phone: phone }],
        })
        .exec();

      if (existingAuthenticationLogin) throw new HttpException(AuthConst.USER_MATCH, HttpStatus.FORBIDDEN);

      // Hash the password before saving the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdAuthentication = new this.authenticationModel({
        ...createAuthDto,
        password: hashedPassword,
      });

      await createdAuthentication.save();
      id = (createdAuthentication._id as Types.ObjectId).toString();

      this.client.emit('user_created', createdAuthentication);
      this.logger.info('user store success');
      const tokensData = await this.authClient.getSignUpAccess(id, req.ip, req.headers['user-agent']);

      return {
        message: 'Congratulations, you’ve successfully signed up!',
        data: tokensData,
      };
    } catch (error) {
      this.logger.error('User signup error', error);
      await this.authenticationModel.findByIdAndDelete(id);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @description Send reset password link to user email
   * @param email
   * @returns
   */
  async forgotPassword(email: string) {
    try {
      const user = await this.authenticationModel.findOne({ email }).lean();
      if (!user) throw new NotFoundException('User not found');

      const userId = user._id.toString();
      const token = await this.tokenService.generate(userId);
      const mailData = { email, token };
      this.client.emit('reset_link', mailData);
      return { message: 'Reset link sent', token: token };
    } catch (error) {
      this.logger.error('Error in forgotPassword', error);
      throw new BadRequestException('Failed to send reset link');
    }
  }

  /**
   * @description Reset user password
   * @param token
   * @param resetPasswordDto
   * @returns
   */
  async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
    try {
      const resetTokenValidate = await this.tokenService.validate(token);
      if (!resetTokenValidate) throw new BadRequestException('Invalid or expired token');

      console.log(resetTokenValidate);
      await this.updatePassword(resetTokenValidate, resetPasswordDto.password);
      await this.tokenService.remove(token);

      return { message: 'Password updated' };
    } catch (error) {
      this.logger.error('Error in resetPassword', error);
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * @description Update user password
   * @param userId
   * @param newPassword
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.authenticationModel.updateOne({ _id: userId }, { $set: { password: hashedPassword } }).exec();
    } catch (error) {
      this.logger.error('Error updating password', error);
      throw new BadRequestException(error);
    }
  }
}
