import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import { Auth as AuthConst } from '../../const/auth.const';
import { LoginAuthDto } from './dto/login-auth.dto';


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
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

    // we removed password from the response for security reasons
    const { password: string, ...userWithoutPassword } = createdAuthentication.toObject();

    this.logger.info('user store success');
    return userWithoutPassword;
  }


  async loginService(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;
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
    return {
       access_token: await this.jwtService.signAsync(payload),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
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
}
