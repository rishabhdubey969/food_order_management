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

  /**
   * Find a profile by ID.
   * Logs the operation and throws if not found.
   */
  async profileFindOneService(id: string) {
    this.logger.info(`Finding profile with id: ${id}`);
    const existingProfileCheck = await this.profileModel
      .findOne({ _id: id })
      .select('-password') // exclude password from result
      .lean();

    if (!existingProfileCheck) {
      this.logger.warn(`Profile not found for id: ${id}`);
      throw new HttpException(ProfileConst.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    this.logger.info(`Profile found for id: ${id}`);
    return existingProfileCheck;
  }

  /**
   * Update a profile by ID.
   * Logs the operation and throws if update fails.
   */
  async profileUpdateService(id: string, updateProfileDto: UpdateProfileDto) {
    this.logger.info(`Updating profile with id: ${id}`);
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: id }, // Find the profile by userId
        { $set: updateProfileDto }, // Update with the data from UpdateProfileDto
        { new: true }, // Return the updated document
      )
      .select('-password')
      .exec();

    if (!updatedProfile) {
      this.logger.error(`Profile update failed for id: ${id}`);
      throw new HttpException(
        ProfileConst.UPDATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.info(`Profile updated for id: ${id}`);
    return updatedProfile;
  }

  /**
   * Soft delete a profile by ID.
   * Logs the operation.
   */
  async remove(id: string) {
    this.logger.info(`Soft deleting profile with id: ${id}`);
    return this.profileModel.findByIdAndUpdate(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
  }
}
