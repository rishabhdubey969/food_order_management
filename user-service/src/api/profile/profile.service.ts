import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticationDocument, Auth } from '../auth/entities/auth.entity'
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from 'const/profile.const';

@Injectable()
export class ProfileService {

  constructor(
    @InjectModel(Auth.name)
    private authenticationModel: Model<AuthenticationDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
  ) { }

  async profileGetService() {
    const usersWithoutPasswords = await this.authenticationModel
      .find({}, { password: 0 }) // exclude password field
      .lean()
      .exec();
    this.logger.info('user data retrieve successfully');
    return usersWithoutPasswords;
  }

  async profileFindOneService(id: string) {
    const existingProfileCheck = await this.authenticationModel
      .findOne({ _id: id })
      .select('-password') // exclude password from result
      .lean();

    if (!existingProfileCheck) {
      throw new HttpException(Profile.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    return existingProfileCheck;
  }

  async profileUpdateService(id: string, updateProfileDto: UpdateProfileDto) {

       const updatedProfile = await this.authenticationModel.findOneAndUpdate(
      { _id: id }, // Find the profile by userId
      { $set: updateProfileDto }, // Update with the data from UpdateProfileDto
      { new: true }, // Return the updated document
    ).select('-password').exec();

    if (!updatedProfile) {
      throw new HttpException(Profile.UPDATE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return updatedProfile;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
