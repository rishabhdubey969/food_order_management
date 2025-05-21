import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederController } from './seeder.controller';
import { SeederService } from './seeder.service';
import { Admin, AdminSchema } from './entities/seeder.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  controllers: [SeederController],
  providers: [SeederService],
  exports:[SeederService]
})
export class SeederModule {}