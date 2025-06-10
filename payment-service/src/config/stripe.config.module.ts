import { Module } from '@nestjs/common';
import { StripeConfigService } from './stripe.config';

@Module({
  providers: [StripeConfigService],
  exports: [StripeConfigService],
})
export class StripeConfigModule {}
