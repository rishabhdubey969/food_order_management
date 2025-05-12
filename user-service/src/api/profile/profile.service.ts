import { Inject, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticationDocument, Auth } from '../auth/entities/auth.entity'
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProfileService {

    constructor(
      @InjectModel(Auth.name)
      private authenticationModel: Model<AuthenticationDocument>,
      @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) { }

  create(createProfileDto: CreateProfileDto) {
    return 'This action adds a new profile';
  }

 async profileGetService() {
   const usersData = await this.authenticationModel.find().exec();
   this.logger.info('user data retrieve successfully');
   return usersData;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
