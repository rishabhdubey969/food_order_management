// import { Module } from '@nestjs/common';
// import { ManagerService } from './manager.service';
// import { ManagerController } from './manager.controller';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ManagerSchema } from './schema/manager.schema';

// @Module({
//   imports: [MongooseModule.forFeature([{ name: 'Manager', schema: ManagerSchema }])],
//   providers: [ManagerService],
//   controllers: [ManagerController],
//   exports: []
// })
// export class ManagerModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { ManagerSchema, Manager } from './schema/manager.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Manager.name, schema: ManagerSchema }]),
    JwtModule.register({
      secret: 'your_jwt_secret', // Replace with env variable in real apps
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [ManagerService],
  controllers: [ManagerController],
})
export class ManagerModule {}

