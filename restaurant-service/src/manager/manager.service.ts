import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  OnModuleInit,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Collection, Connection, Model, Types ,isValidObjectId} from 'mongoose';
import * as bcrypt from 'bcrypt';
import ManagerLoginDto from 'src/manager/modules/auth/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/modules/auth/dto/managerSignuodto';
import { Manager, ManagerDocument } from './schema/manager.schema';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { TokenService } from 'src/manager/token/token.service';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ManagerGateway } from 'src/manager/gateway/manager.gateway';
import { Order, OrderDocument } from './schema/order.schema';
import { async } from 'rxjs';
import { ObjectId } from 'mongodb';
import { KafkaService } from './kafka/kafka.service';




export interface ManagerData {
  id: String;
  name: String;
  email: String;
  phone: String;
  password: String;
  restaurantId: String;
  accountNumber: String;
  ifscCode: String;
  bankName: String;
}
@Injectable()
export class ManagerService  {
  private readonly logger = new Logger(ManagerService.name);
  private cartCollection: Collection;
  cartService: any;
  orderService: any;

  constructor(
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly managerGateway: ManagerGateway,
    private readonly kafkaService: KafkaService
  ) {}

  async Signup(managerSignupDto: ManagerSignupDto) {
  try {
    const { email, password } = managerSignupDto;
    
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingManager = await this.managerModel.findOne({ email });
    if (existingManager) {
      throw new BadRequestException(ERROR_MESSAGES.MANAGER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new this.managerModel({
      ...managerSignupDto,
      password: hashedPassword,
      isActiveManager: false,
      isdeleted: false,
      
    });

    const savedManager = await newManager.save();

    return {
      message: SUCCESS_MESSAGES.MANAGER_SIGNUP,
      data: {
        id: savedManager._id,
        name: savedManager.name,
        email: savedManager.email,
        // phone: savedManager.phone,
        accountNumber: savedManager.accountNumber,
        ifscCode: savedManager.ifscCode,
        bankName: savedManager.bankName,
      },
    };
  } catch (error) {
    this.logger.error('Signup failed', error.stack);
    
    if (error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Registration process failed');
  }
}
  async login(managerLoginDto: ManagerLoginDto) {
    const { email, password } = managerLoginDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const manager = await this.managerModel.findOne({ email });
    if (!manager) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const payload = {
      sub: manager._id,
      email: manager.email,
      role: 'manager',
    };

    const token = await this.tokenService.sign(payload);

    return {
      message: SUCCESS_MESSAGES.MANAGER_LOGIN,
      token,
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        // phone: manager.phone,
      },
    };
  }

  async logout(token: string) {
    try {
      await this.tokenService.verify(token);
      await this.tokenService.blacklistToken(token);

      return {
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      };
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

      return {
        message: SUCCESS_MESSAGES.MANAGER_SIGNUP,
        data: {
          id: savedManager._id.toString(),
          name: savedManager.name,
          email: savedManager.email,
          phone: savedManager.phone,
          restaurant_id: savedManager.restaurantId,
          account_number: savedManager.accountNumber,
          ifsc_code: savedManager.ifscCode,
          bank_name: savedManager.bankName,
        },
      };
    } catch (error) {
      this.logger.error(`Signup failed: ${error.message}`, error.stack);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13, // INTERNAL
        message: `Signup error: ${error.message}`,
      });
    }
  }
  async getManagerById(id: string) {
    try {
      const manager = await this.managerModel.findById(id);
      if (!manager) {
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }

      return {
        message: SUCCESS_MESSAGES.MANAGER_FOUND,
        data: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
          // phone: manager.phone,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch manager with ID: ${id}`, error.stack);
      throw error;
    }
  }

  async updateManager(id: string, updateManagerDto: Partial<ManagerSignupDto>) {
    try {
      const updatedManager = await this.managerModel.findByIdAndUpdate(
        id,
        updateManagerDto,
        { new: true },
      );

      if (!updatedManager) {
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }

      return {
        message: SUCCESS_MESSAGES.MANAGER_UPDATED,
        data: updatedManager,
      };
    } catch (error) {
      this.logger.error(`Failed to update manager with ID: ${id}`, error.stack);
      throw error;
    }
  }
   async handleIsFoodAvailable(cartId: ObjectId): Promise<any> {
  try {
    if (!cartId || !isValidObjectId(cartId)) {
      throw new BadRequestException('Invalid cart ID');
    }

    const cartData = await this.connection.collection('carts').findOne({_id: cartId});
    
    if (!cartData) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    const restaurantId = cartData.restaurantId;
    if (!restaurantId) {
      throw new BadRequestException('Cart has no associated restaurant');
    }

    const manager = await this.managerModel.findOne(
      { restaurantId: restaurantId }, 
      { _id: 1 }
    ).exec();
    
    if (!manager) {
      throw new NotFoundException(`No manager found for restaurant ${restaurantId}`);
    }

    return await this.managerGateway.handleNewOrder(manager._id, cartData);
  } catch (error) {
    this.logger.error(`Error handling new order for cart ${cartId}, error.stack`);
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Failed to process new order');
  }
}

  async processOrderDecision(orderId: string, decision: 'accept' | 'reject') {
    try {
      const result =
        decision === 'accept'
          ? await this.orderService.acceptOrder(orderId)
          : await this.orderService.rejectOrder(orderId);

      return {
        message: `Order ${decision}ed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to ${decision} order with ID: ${orderId}`, error.stack);
      throw new InternalServerErrorException(`Failed to ${decision} order`);
    }
  }

  async handleOrderHandover(orderId: Types.ObjectId){
    await this.kafkaService.handleEvent('handOvered', {orderId: orderId})
  }
}