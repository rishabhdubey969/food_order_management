import { forwardRef, Inject, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Manager, ManagerSchema } from './entities/manager.entity';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },{ name: Manager.name, schema: ManagerSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
