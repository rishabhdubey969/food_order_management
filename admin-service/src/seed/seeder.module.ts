import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederService } from './super-admin.seeder';
import { Auth, AuthenticationSchema } from '../api/auth/entities/auth.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Auth.name, schema: AuthenticationSchema }])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
