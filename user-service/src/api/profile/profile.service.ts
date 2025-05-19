import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

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
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: id }, // Find the profile by userId
        { $set: updateProfileDto }, // Update with the data from UpdateProfileDto
        { new: true }, // Return the updated document
      )
      .select('-password')
      .exec();

    if (!updatedProfile) {
      throw new HttpException(
        ProfileConst.UPDATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return updatedProfile;
  }

  async remove(id: string) {
    return this.profileModel.findByIdAndUpdate(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
  }
}
