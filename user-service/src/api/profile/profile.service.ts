import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, ProfileDocument } from './entities/profile.entity';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PROFILE, PROFILE as ProfileConst, WINSTON_LOGGER_PROFILE } from 'constants/profile.const';
import { MediaClient } from 'src/grpc/media/media.client';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly mediaClient: MediaClient,
  ) {}

  /**
   * Find a profile by ID.
   * Logs the operation and throws if not found.
   */
  async profileFindOneService(id: string) {
    this.logger.info(`${WINSTON_LOGGER_PROFILE.FIND_PROFILE}: ${id}`);
    const existingProfileCheck = await this.profileModel
      .findOne({ _id: id })
      .select('-password') // exclude password from result
      .lean();

    if (!existingProfileCheck) {
      this.logger.warn(`${WINSTON_LOGGER_PROFILE.NOT_FOUND_PROFILE}: ${id}`);
      throw new HttpException(ProfileConst.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    this.logger.info(`${WINSTON_LOGGER_PROFILE.PROFILE_FOUND}: ${id}`);
    return existingProfileCheck;
  }

  /**
   * Update a profile by ID.
   * Logs the operation and throws if update fails.
   */
  async profileUpdateService(id: string, updateProfileDto: UpdateProfileDto) {
    this.logger.info(`${WINSTON_LOGGER_PROFILE.UPDATE_PROFILE}: ${id}`);
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: id }, // Find the profile by userId
        { $set: updateProfileDto }, // Update with the data from UpdateProfileDto
        { new: true }, // Return the updated document
      )
      .select('-password')
      .exec();

    if (!updatedProfile) {
      this.logger.error(`${WINSTON_LOGGER_PROFILE.PROFILE_UPDATE_FAILED}: ${id}`);
      throw new HttpException(ProfileConst.UPDATE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.logger.info(`${WINSTON_LOGGER_PROFILE.PROFILE_UPDATE_SUCCESS}: ${id}`);
    return updatedProfile;
  }

  /**
   * Soft delete a profile by ID.
   * Logs the operation.
   */
  async remove(id: string) {
    this.logger.info(`${WINSTON_LOGGER_PROFILE.PROFILE_SOFT_DELETE}: ${id}`);
    return this.profileModel.findByIdAndUpdate({ _id: id }, { isDeleted: true, deletedAt: new Date() }, { new: true });
  }

  async mediaUploadService(id: string, uploadMediaDto) {
    try {
      return this.mediaClient.GeneratePresignedUrlClient(PROFILE.USER, PROFILE.PROFILE_NAME, id, uploadMediaDto);
    } catch (error) {
      throw new HttpException(error.message || PROFILE.Media_PROFILE, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async confirmUploadService(id: string) {
    return this.mediaClient.ConfirmUploadClient(
      'media/user/profile/684d51abab85e4eea0294410/7390b6b0-08d8-4670-b544-6ce4aa28c4c1.jpg',
      'profile',
      id,
    );
  }
}
