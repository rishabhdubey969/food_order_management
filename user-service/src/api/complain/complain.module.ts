import { Module } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { ComplainController } from './complain.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Complain, ComplainSchema } from './entities/complain.entity';
import { AuthClient } from 'src/grpc/authentication/auth.client';

@Module({
   imports: [
      MongooseModule.forFeature([{ name: Complain.name, schema: ComplainSchema }]),
    ],
  controllers: [ComplainController],
  providers: [ComplainService, AuthClient],
})
export class ComplainModule {}
