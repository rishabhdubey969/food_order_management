import { Controller, Get, Body, Param, Delete, UsePipes, ValidationPipe, Patch, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../../guard/auth.guard';

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
  @Patch(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileUpdate(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.profileUpdateService(id, updateProfileDto);
  }

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @param id - The ID of the user whose profile is to be retrieved.
   * @returns The user profile.
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileFindOne(@Param('id') id: string) {
    return this.profileService.profileFindOneService(id);
  }

  /**
   * Removes the profile of a user by their ID.
   *
   * @param id - The ID of the user whose profile is to be removed.
   * @returns The result of the remove operation.
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.profileService.remove(id);
  }
}
