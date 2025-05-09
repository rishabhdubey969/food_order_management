import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthenticationDocument, Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import {Auth as AuthConst } from '../../const/auth.const';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
  ) {}

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

  loginService() {
    return `This action returns all auth`;
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
}
