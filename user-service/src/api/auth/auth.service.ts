import { Injectable, Inject, HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model, Types } from 'mongoose';
import { AUTH as AUTH_CONST, RABBIT_MQ, WINSTON_LOGGER_CONST } from 'constants/auth.const';
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
    @Inject(RABBIT_MQ.NOTIFICATION_SERVICE) private readonly client: ClientProxy,
  ) {}

  /**
   * @description Send OTP to user email
   * @param email
   * @returns
   */
  async sendOtpService(email: string) {
    try {
      this.logger.info(WINSTON_LOGGER_CONST.SEND_OTP);
      const user = await this.authenticationModel.findOne({ email }).lean();
      if (user) throw new NotFoundException(AUTH_CONST.USER_MATCH);

      const otp = await this.tokenService.signupOtp(email);
      const mailData = { otp, email };

      this.client.emit(WINSTON_LOGGER_CONST.SIGNUP_OTP, mailData);
      return { message: AUTH_CONST.OTP_SENT };
    } catch (error) {
      this.logger.error(WINSTON_LOGGER_CONST.ERROR_SEND_OTP, error);
      throw new BadRequestException(error.message || AUTH_CONST.OTP_FAILED);
    }
  }

  /**
   * @description Sign up service for user registration
   * @param createAuthDto
   * @param req
   * @returns
   */
  async signUpService(createAuthDto: CreateAuthDto, req: any) {
    this.logger.info(WINSTON_LOGGER_CONST.SIGNUP_START);
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

      if (existingAuthenticationLogin) throw new HttpException(AUTH_CONST.USER_MATCH, HttpStatus.FORBIDDEN);

      // Hash the password before saving the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdAuthentication = new this.authenticationModel({
        ...createAuthDto,
        password: hashedPassword,
      });

      await createdAuthentication.save();
      id = (createdAuthentication._id as Types.ObjectId).toString();

      this.client.emit(RABBIT_MQ.USER_CREATED, createdAuthentication);
      this.logger.info(WINSTON_LOGGER_CONST.SIGNUP_SUCCESS);
      const tokensData = await this.authClient.getSignUpAccess(id, req.ip, req.headers['user-agent']);

      return {
        message: AUTH_CONST.SUCCESS_SIGNUP,
        data: tokensData,
      };
    } catch (error) {
      this.logger.error(WINSTON_LOGGER_CONST.SIGNUP_ERROR, error);
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
      if (!user) throw new NotFoundException(AUTH_CONST.USER_NOT_FOUND);

      const userId = user._id.toString();
      const token = await this.tokenService.generate(userId);
      const mailData = { email, token };
      this.client.emit(RABBIT_MQ.REST_LINK, mailData);
      return { message: AUTH_CONST.SENT_REST_LINK, token: token };
    } catch (error) {
      this.logger.error(WINSTON_LOGGER_CONST.FORGET_PASSWORD_ERROR, error);
      throw new BadRequestException(AUTH_CONST.Failed_RESET_LINK);
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
      if (!resetTokenValidate) throw new BadRequestException(WINSTON_LOGGER_CONST.EXPIRE_INVALID);

      await this.updatePassword(resetTokenValidate, resetPasswordDto.password);
      await this.tokenService.remove(token);

      return { message: AUTH_CONST.PASSWORD_SUCCESS };
    } catch (error) {
      this.logger.error(WINSTON_LOGGER_CONST.RESET_PASSWORD, error);
      throw new BadRequestException(AUTH_CONST.FAILED_REST_PASSWORD);
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
      this.logger.error(WINSTON_LOGGER_CONST.UPDATE_PASSWORD_ERROR, error);
      throw new BadRequestException(error);
    }
  }
}
