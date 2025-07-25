import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './entities/profile.entity';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { MediaClient } from 'src/grpc/media/media.client'; 
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    AuthModule
  ],
  controllers: [ProfileController],
  providers: [ProfileService, AuthClient, MediaClient],
})
export class ProfileModule {}
