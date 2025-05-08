import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally available
    })
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
