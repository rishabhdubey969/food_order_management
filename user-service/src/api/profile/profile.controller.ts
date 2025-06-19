import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Patch,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { AuthGuard } from '../../guard/auth.guard';
import { DeleteProfileSwagger, GetProfileSwagger, UpdateProfileSwagger } from 'src/swagger_doc/profile.swagger';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Updates the profile of a user by their ID.
   *
   * @param id - The ID of the user whose profile is to be updated.
   * @param updateProfileDto - The data transfer object containing updated profile information.
   * @returns The updated user profile.
   */
  @Patch()
  @UpdateProfileSwagger()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileUpdate(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.profileUpdateService(req.user.payload.sub, updateProfileDto);
  }

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @param id - The ID of the user whose profile is to be retrieved.
   * @returns The user profile.
   */
  @Get()
  @GetProfileSwagger()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileFindOne(@Req() req: any) {
    return this.profileService.profileFindOneService(req.user.payload.sub);
  }

  /**
   * Removes the profile of a user by their ID.
   *
   * @param id - The ID of the user whose profile is to be removed.
   * @returns The result of the remove operation.
   */
  @Delete()
  @DeleteProfileSwagger()
  @UseGuards(AuthGuard)
  remove(@Req() req: any) {
    return this.profileService.remove(req.user.payload.sub);
  }

  /**
   * Uploads media files associated with the user's profile.
   *
   * @param req - The request object containing user information.
   * @param uploadMediaDto - An array of media upload data transfer objects.
   * @returns The result of the media upload operation.
   */
  @Get('upload')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(AuthGuard)
  async mediaUpload(@Req() req: any, @Body() uploadMediaDto: UploadMediaDto[]) {
    return this.profileService.mediaUploadService(req.user.payload.sub, uploadMediaDto);
  }

  /**
   * Confirms the upload of media files associated with the user's profile.
   *
   * @param req - The request object containing user information.
   * @returns The result of the upload confirmation operation.
   */
  @Get('confirm-upload')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(AuthGuard)
  async confirmUpload(@Req() req: any) {
    return this.profileService.confirmUploadService(req.user.payload.sub);
  }
}
