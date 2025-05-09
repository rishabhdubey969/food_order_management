import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantSchema } from './schema/restaurant.schema';
import { MenuItemSchema } from './schema/menuItem.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Restaurant', schema: RestaurantSchema },
    { name: 'MenuItem', schema: MenuItemSchema },
  ])],
  providers: [RestaurantService],
  controllers: [RestaurantController],
  exports: []
})
export class RestaurantModule {}
