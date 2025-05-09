import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerSchema } from './schema/manager.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Manager', schema: ManagerSchema }])],
  providers: [ManagerService],
  controllers: [ManagerController],
  exports: []
})
export class ManagerModule {}
