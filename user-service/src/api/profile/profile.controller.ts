import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UsePipes, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

   @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileCreate(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.profileCreateService(createProfileDto);
  }


  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileGet(@Req() req: any) {
    return this.profileService.profileGetService();
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileFindOne(@Param('id') id: string) {
    return this.profileService.profileFindOneService(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  profileUpdate(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.profileUpdateService(id, updateProfileDto); 
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }

}
