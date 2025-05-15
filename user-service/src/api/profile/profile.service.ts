import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, ProfileDocument } from './entities/profile.entity';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile as ProfileConst } from 'const/profile.const';

@Injectable()
export class ProfileService {

  constructor(
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
  ) { }


  async profileCreateService(createProfileDto: CreateProfileDto) {

    const existingProfileCheck = await this.profileModel
      .findOne({ user_id: createProfileDto.user_id })
      .lean();

    if (existingProfileCheck) {
      throw new HttpException(ProfileConst.PROFILE_CREATED, HttpStatus.FORBIDDEN);
    }

    const createdProfile = new this.profileModel(createProfileDto);
    await createdProfile.save();
    return createdProfile;


  }

  async profileGetService() {
    try {
      const usersWithoutPasswords = await this.profileModel
        .find()
        .exec();
      this.logger.info('user data retrieve successfully');
      return { message: 'This is a successful response!', data: usersWithoutPasswords };

    } catch (error) {
      this.logger.error('Error retrieving user data');
      throw new HttpException(
        { message: 'Something went wrong in the service', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async profileFindOneService(id: string) {
    const existingProfileCheck = await this.profileModel
      .findOne({ _id: id })
      .select('-password') // exclude password from result
      .lean();

    if (!existingProfileCheck) {
      throw new HttpException(ProfileConst.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    return existingProfileCheck;
  }

  async profileUpdateService(id: string, updateProfileDto: UpdateProfileDto) {

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: id }, // Find the profile by userId
      { $set: updateProfileDto }, // Update with the data from UpdateProfileDto
      { new: true }, // Return the updated document
    ).select('-password').exec();

    if (!updatedProfile) {
      throw new HttpException(ProfileConst.UPDATE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return updatedProfile;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }

}
