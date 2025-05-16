import { Injectable, Inject, HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import { Auth as AuthConst } from 'const/auth.const';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { TokenService } from './token.service'


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private authClient: AuthClient,
    private tokenService:TokenService
  ) { }

  async signUpService(createAuthDto: CreateAuthDto) {

    const { email, password } = createAuthDto;
    const existingAuthenticationLogin = await this.authenticationModel
      .findOne({ email })
      .exec();

    if (existingAuthenticationLogin) {
      throw new HttpException(AuthConst.EmailExist, HttpStatus.FORBIDDEN);
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdAuthentication = new this.authenticationModel({
      ...createAuthDto,
      password: hashedPassword
    });
    await createdAuthentication.save();

    const newUSerPayload = {
      id: createdAuthentication.id,
      email: createdAuthentication.email,
      phone: createdAuthentication.phone,
      role: createdAuthentication.role,
      isActive: createdAuthentication.is_active
    }

    this.logger.info('user store success');
    return await this.authClient.getSignUpAccess(newUSerPayload);
  }


  async loginService(loginAuthDto: LoginAuthDto) {
    const { email, password, deviceId } = loginAuthDto;
    const existingAuthenticationLogin = await this.authenticateUser(email);

    const isPasswordValid = await bcrypt.compare(password, existingAuthenticationLogin.password);

    if (!isPasswordValid) {
      throw new HttpException(AuthConst.PASSWORD_NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    const payload = {
      id: existingAuthenticationLogin._id,
      email: existingAuthenticationLogin.email,
    };
    this.logger.info('token store success');
    // return {
    //    access_token: await this.jwtService.signAsync(payload),
    // };
    const token = await this.jwtService.signAsync(payload);
    //return await this.authClient.getLoginAccess(token);

  }

  
  async forgotPassword(email: string) {
    const user = await this.authenticationModel.findOne({email}).lean();
    if (!user) throw new NotFoundException('User not found');
    const userId = user._id.toString();
console.log(userId);
    const token = await this.tokenService.generate(userId);
    

    return { message: 'Reset link sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.tokenService.validate(token);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.updatePassword(userId, hashed);
    await this.tokenService.remove(token);

    return { message: 'Password updated' };
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }


  /**
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
    await this.authenticationModel.updateOne({ _id: userId }, { $set: { password: hashedPassword } }).exec();
  }
}
