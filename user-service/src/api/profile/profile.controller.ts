import { Controller, Get, Body, Param, Delete, UsePipes, ValidationPipe, Patch, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
// import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../guard/auth.guard';
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileUpdate(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.profileUpdateService(id, updateProfileDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileFindOne(@Param('id') id: string) {
    return this.profileService.profileFindOneService(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.profileService.remove(id);
  }
}
