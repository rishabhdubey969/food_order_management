import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model, Types } from 'mongoose';
<<<<<<< Updated upstream
import { Auth as AuthConst } from 'const/auth.const';
import { LoginAuthDto } from './dto/login-auth.dto';
=======
import { Auth as AuthConst } from 'constants/auth.const';
>>>>>>> Stashed changes
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { TokenService } from './token.service';
import { ClientProxy } from '@nestjs/microservices';
<<<<<<< Updated upstream
=======
import { LogService } from 'src/api/user-logs/log.service';
>>>>>>> Stashed changes

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private authClient: AuthClient,
    private tokenService: TokenService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

<<<<<<< Updated upstream
  async signUpService(createAuthDto: CreateAuthDto, req: any) {
    this.logger.info('user store start');
    const { email, password } = createAuthDto;
    const existingAuthenticationLogin = await this.authenticationModel
      .findOne({ email })
      .exec();

    if (existingAuthenticationLogin) {
      throw new HttpException(AuthConst.EmailExist, HttpStatus.FORBIDDEN);
=======
  /**
   * @description Send OTP to user email
   * @param email
   * @returns
   */
  async sendOtpService(email: string) {
    try {
      this.logger.info('Sending OTP to user');
      this.tokenService.signupOtp(email);
       this.client.emit('signup_otp', email);
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
      const createdAuthentication = new this.authenticationModel({ ...createAuthDto, password: hashedPassword });

      await createdAuthentication.save();
      id = (createdAuthentication._id as Types.ObjectId).toString();

      this.client.emit('user_created', createdAuthentication);
      this.logger.info('user store success');
      const tokensData = await this.authClient.getSignUpAccess(id, req.ip, req.headers['user-agent']);

      return { message: 'Congratulations, you’ve successfully signed up!', data: tokensData };
    } catch (error) {
      this.logger.error('User signup error', error);
      await this.authenticationModel.findByIdAndDelete(id);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
>>>>>>> Stashed changes
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdAuthentication = new this.authenticationModel({
      ...createAuthDto,
      password: hashedPassword,
    });

    await createdAuthentication.save();
     const id = (createdAuthentication._id as Types.ObjectId).toString();


    const newUSerPayload = {
      id: createdAuthentication._id,
      email: createdAuthentication.email,
      phone: createdAuthentication.phone,
      role: createdAuthentication.role,
      isActive: createdAuthentication.is_active,
    };

    

    this.client.emit('user_created', newUSerPayload);
    this.logger.info('user store success');

    const tokensData = await this.authClient.getSignUpAccess(id, req.ip, req.headers['user-agent']);
    return { message: "Congratulations, you’ve successfully signed up!", data: tokensData };
  }

  async forgotPassword(email: string) {
    const user = await this.authenticationModel.findOne({ email }).lean();
    if (!user) throw new NotFoundException('User not found');

    const userId = user._id.toString();

<<<<<<< Updated upstream
    const token = await this.tokenService.generate(userId);
    console.log(token);
    return { message: 'Reset link sent' };
=======
      return { message: 'Reset link sent', token: token };
    } catch (error) {
      this.logger.error('Error in forgotPassword', error);
      throw new BadRequestException('Failed to send reset link');
    }
>>>>>>> Stashed changes
  }

  async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
    const resetTokenValidate = await this.tokenService.validate(token);
    if (!resetTokenValidate)
      throw new BadRequestException('Invalid or expired token');

    const hashed = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.updatePassword(resetTokenValidate, hashed);
    await this.tokenService.remove(token);

    return { message: 'Password updated' };
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  /**
<<<<<<< Updated upstream
   * @description  Authentication User (Private function)
   * @param email
   * @returns Return user information if email is authenticated
   */
  async authenticateUser(email: string) {
    const existingAuthenticationLogin = await this.authenticationModel
      .findOne({ email })
      .exec();

    if (!existingAuthenticationLogin) {
      throw new HttpException(AuthConst.EMAIL_NOT_FOUND, HttpStatus.FORBIDDEN);
    }
    return existingAuthenticationLogin;
  }

  async findByEmail(email: string): Promise<Auth | null> {
    return this.authenticationModel.findOne({ email }).exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.authenticationModel
      .updateOne({ _id: userId }, { $set: { password: hashedPassword } })
      .exec();
=======
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
>>>>>>> Stashed changes
  }
}
