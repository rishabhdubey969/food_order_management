import { Module } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { ComplainController } from './complain.controller';

@Module({
  controllers: [ComplainController],
  providers: [ComplainService],
})
export class ComplainModule {}
