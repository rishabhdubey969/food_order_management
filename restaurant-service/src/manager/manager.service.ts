import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import ManagerLoginDto from 'src/manager/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/dto/managerSignuodto';
import { Manager, ManagerDocument } from './schema/manager.schema';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { ClientGrpc } from '@nestjs/microservices';

interface RestaurantServiceClient {
  IsItemAvailable(data: { cartId: string }): Promise<{ kitchenStatus: string }>;
}

@Injectable()
export class ManagerService implements OnModuleInit {
  private restaurantClient: RestaurantServiceClient;

  constructor(
    @InjectModel(Manager.name)
    private readonly managerModel: Model<ManagerDocument>,
    private readonly jwtService: JwtService,
    // gRPC client to talk to Restaurant service
    @Inject('RESTAURANT_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  // gRPC Client Initialization
  onModuleInit() {
    this.restaurantClient = this.client.getService<RestaurantServiceClient>('RestaurantService');
  }

  // gRPC call to Restaurant to check item availability
  async fetchKitchenStatus(cartId: string): Promise<boolean> {
    const response = await this.restaurantClient.IsItemAvailable({ cartId });
    return response.kitchenStatus === 'true';
  }


// @Injectable()
// export class ManagerService {
//   fetchKitchenStatus(cartId: string) {
//       throw new Error('Method not implemented.');
//   }
//   constructor(
//        @InjectModel(Manager.name) 
//        private readonly managerModel: Model<ManagerDocument>,

//     private readonly jwtService: JwtService,
//   ) {}

  async login(managerLoginDto: ManagerLoginDto) {
    const { email, password } = managerLoginDto;

    const manager = await this.managerModel.findOne({ email });
    if (!manager) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (manager.isActiveManager !== true) {
      throw new UnauthorizedException(ERROR_MESSAGES.MANAGER_NOT_APPROVED);
    }

    const payload = {
      sub: manager._id,
      email: manager.email,
      role: 'manager',
    };
    const token = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      message: SUCCESS_MESSAGES.MANAGER_LOGIN,
      token,
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
      },
    };
  }

  async signup(managerSignupDto: ManagerSignupDto) {
    const {
      email,
      phone,
      password,
      name,
      restaurantId,
      accountNumber,
      ifscCode,
      bankName,
    } = managerSignupDto;

    const existingManager = await this.managerModel.findOne({ email });
    if (existingManager) {
      throw new BadRequestException(ERROR_MESSAGES.MANAGER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new this.managerModel({
      name,
      email,
      phone,
      password: hashedPassword,
      restaurantId,
      accountNumber,
      ifscCode,
      bankName,
      isActive: 'pending',
      isActiveManager: false,
    });

    const savedManager = await newManager.save();

    return {
      message: SUCCESS_MESSAGES.MANAGER_SIGNUP,
      data: {
        id: savedManager._id,
        name: savedManager.name,
        email: savedManager.email,
        phone: savedManager.phone,
        restaurantId: savedManager.restaurantId,
        accountNumber: savedManager.accountNumber,
        ifscCode: savedManager.ifscCode,
        bankName: savedManager.bankName,
      },
    };
  }

  async getManagerById(id: string) {
    const manager = await this.managerModel.findById(id);
    if (!manager) {
      throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
    }

    return {
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
      },
    };
  }

  async updateManager(id: string, updateData: Partial<ManagerSignupDto>) {
    const manager = await this.managerModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!manager) {
      throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
    }

    return {
      message: SUCCESS_MESSAGES.MANAGER_UPDATED,
      data: manager,
    };
  }

  async deleteManager(id: string) {
    const manager = await this.managerModel.findByIdAndDelete(id);
    if (!manager) {
      throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
    }

    return {
      message: SUCCESS_MESSAGES.MANAGER_DELETED,
    };
  }


}