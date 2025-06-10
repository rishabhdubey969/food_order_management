// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
//   UnauthorizedException,
//   Inject,
//   OnModuleInit,
//   InternalServerErrorException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import * as bcrypt from 'bcrypt';
// import ManagerLoginDto from 'src/manager/dto/managerLogindto';
// import ManagerSignupDto from 'src/manager/dto/managerSignuodto';
// import { Manager, ManagerDocument } from './schema/manager.schema';
// import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
// import { TokenService } from 'src/manager/token/token.service';



// @Injectable()
// export class ManagerService implements OnModuleInit {
//   validateManagerToken(token: any) {
//       throw new Error('Method not implemented.');
//   }
 

//   constructor(
//     @InjectModel(Manager.name) private readonly managerModel: Model<ManagerDocument>,
//     private readonly tokenService: TokenService, 
//   ) {}
//   onModuleInit() {
//     throw new Error('Method not implemented.');
//   }

  
//   // async fetchKitchenStatus(cartId: string): Promise<boolean> {
//   //   try {
//   //     const response = await this.restaurantClient.IsItemAvailable({ cartId });
//   //     return response.kitchenStatus === 'true';
//   //   } catch (error) {
//   //     throw new InternalServerErrorException('Failed to fetch kitchen status');
//   //   }
//   // }

//   async login(managerLoginDto: ManagerLoginDto) {
//   const { email, password } = managerLoginDto;
//   const manager = await this.managerModel.findOne({ email });
//   if (!manager) {
//     throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
//   }

//   const isPasswordValid = await bcrypt.compare(password, manager.password);
//   if (!isPasswordValid) {
//     throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
//   }

//   const payload = {
//     sub: manager._id,
//     email: manager.email,
//     role: 'manager',
//   };

//   const token = await this.tokenService.sign(payload);

//   return {
//     message: SUCCESS_MESSAGES.MANAGER_LOGIN,
//     token,
//     data: {
//       id: manager._id,
//       name: manager.name,
//       email: manager.email,
//       phone: manager.phone,
//     },
//   };
// }

//   async logout(token: string) {
//     // i have to implement blacklist with Redis
//     return { message: 'Manager successfully logged out' };
//   }

//   async getAllManagers(token: string) {
//     const user = await this.tokenService.verify(token);
//     if (user.role !== 'admin') {
//       throw new ForbiddenException('Only admins can access this route');
//     }

//     const managers = await this.managerModel.find().select('-password');
//     return {
//       message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
//       data: managers,
//     };
//   }

//   async signup(managerSignupDto: ManagerSignupDto) {
//     const {
//       email,
//       phone,
//       password,
//       name,
//       restaurantId,
//       accountNumber,
//       ifscCode,
//       bankName,
//     } = managerSignupDto;

//     const existingManager = await this.managerModel.findOne({ email });
//     if (existingManager) {
//       throw new BadRequestException(ERROR_MESSAGES.MANAGER_ALREADY_EXISTS);
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newManager = new this.managerModel({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       restaurantId,
//       accountNumber,
//       ifscCode,
//       bankName,
//       isActiveManager: false,
//       isdeleted:false,
//     });

//     const savedManager = await newManager.save();

//     return {
//       message: SUCCESS_MESSAGES.MANAGER_SIGNUP,
//       data: {
//         id: savedManager._id,
//         name: savedManager.name,
//         email: savedManager.email,
//         phone: savedManager.phone,
//         restaurantId: savedManager.restaurantId,
//         accountNumber: savedManager.accountNumber,
//         ifscCode: savedManager.ifscCode,
//         bankName: savedManager.bankName,
//       },
//     };
//   }

//   async getManagerById(id: string) {
//     const manager = await this.managerModel.findById(id);
//     if (!manager) {
//       throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
//     }

//     return {
//       message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
//       data: {
//         id: manager._id,
//         name: manager.name,
//         email: manager.email,
//         phone: manager.phone,
//       },
//     };
//   }

//   async updateManager(id: string, updateData: Partial<ManagerSignupDto>) {
//     const manager = await this.managerModel.findByIdAndUpdate(id, updateData, {
//       new: true,
//     });

//     if (!manager) {
//       throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
//     }

//     return {
//       message: SUCCESS_MESSAGES.MANAGER_UPDATED,
//       data: manager,
//     };
//   }

//   async deleteManager(id: string) {
//     const manager = await this.managerModel.findByIdAndDelete(id);
//     if (!manager) {
//       throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
//     }

//     return {
//       message: SUCCESS_MESSAGES.MANAGER_DELETED,
//     };
//   }
// }

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
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Collection, Connection, Model, Types ,isValidObjectId} from 'mongoose';
import * as bcrypt from 'bcrypt';
import ManagerLoginDto from 'src/manager/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/dto/managerSignuodto';
import { Manager, ManagerDocument } from './schema/manager.schema';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { TokenService } from 'src/manager/token/token.service';
import { ClientGrpc } from '@nestjs/microservices';
import { ManagerGateway } from 'src/manager/gateway/manager.gateway';
import { Order, OrderDocument } from './schema/order.schema';
import { async } from 'rxjs';
import { ObjectId } from 'mongodb';

@Injectable()
export class ManagerService implements OnModuleInit {
  private readonly logger = new Logger(ManagerService.name);
  private orderCollection: Collection;

  constructor(
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly managerGateway: ManagerGateway
  ) {}

  async onModuleInit() {
    this.orderCollection = this.connection.collection('orders');
  }

  async handleNewOrder(orderData: any): Promise<any> {
    const order = {
      ...orderData,
      status: 'pending_approval',
      createdAt: new Date(),
    };

    const result = await this.orderCollection.insertOne(order);
    const savedOrder = await this.orderCollection.findOne({ _id: result.insertedId });

    if (!savedOrder) {
      throw new Error('Failed to save order');
    }

    if (savedOrder.managerId) {
      const notified = await this.managerGateway.notifyManagerNewOrder(
        savedOrder.managerId.toString(),
        savedOrder
      );

      if (!notified) {
        this.logger.log(`Manager ${savedOrder.managerId} offline, order saved for later`);
      }
    }

    return savedOrder;
  }

  async processOrderDecision(
    //managerId: string,
    orderId: string,
    decision: 'approve' | 'reject',
    // reason?: string
  ): Promise<any> {
    const order = await this.connection.collection('orders').findOne({_id: new ObjectId(orderId)});
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'pending_approval') {
      throw new BadRequestException('Order already processed');
    }
      if (!order.restaurantId) {
    throw new NotFoundException('No restaurant associated with this order');
  }

  const restaurantId = order.restaurantId;
  const managerId = await this.managerModel.findOne({restaurantId: restaurantId}, {_id: 1}).exec();

  if(!managerId){
    throw new NotFoundException("Manager Not Found!!");
  }

  await this.managerGateway.handleNewOrder(managerId as any, order);
  // // managerId from restaurant
  // const restaurant = await this.connection.collection('restaurants').findOne(
  //   { _id: new ObjectId(order.restaurantId) },
  //   { projection: { managerId: 1 } } 
  // );

  // if (!restaurant || !restaurant.managerId) {
  //   throw new NotFoundException('No manager assigned to this restaurant');
  // }

  // const managerId = restaurant.managerId;

  //   const update = {
  //     status: decision === 'approve' ? 'approved' : 'rejected',
  //     managerId: new ObjectId(managerId),
  //     //decisionReason: reason,
  //     decisionAt: new Date(),
  //   };

  //   await this.orderCollection.updateOne(
  //     { _id: new ObjectId(orderId) },
  //     { $set: update }
  //   );

  //   const updatedOrder = await this.orderCollection.findOne({ _id: new ObjectId(orderId) });
  //   if (!updatedOrder) {
  //     throw new Error('Failed to update order');
  //   }

  //   if (decision === 'approve') {
  //     await this.handleApprovedOrder(updatedOrder);
  //   } else {
  //     await this.handleRejectedOrder(updatedOrder);
  //   }

  //   return updatedOrder;
  }

  private async handleApprovedOrder(order: any): Promise<void> {
    this.logger.log(`Order ${order._id} approved by ${order.managerId}`);
    // Add your approval logic here
  }

  private async handleRejectedOrder(order: any): Promise<void> {
    this.logger.log(`Order ${order._id} rejected by ${order.managerId}. Reason: ${order.decisionReason}`);
    // Add your rejection logic here
  }

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
        phone: manager.phone,
      },
    };
  }

  async logout(token: string) {
    // Implement blacklist with Redis
    return { message: 'Manager successfully logged out' };
  }

  async getAllManagers(token: string) {
    const user = await this.tokenService.verify(token);
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can access this route');
    }

    const managers = await this.managerModel.find().select('-password');
    return {
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      data: managers,
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
function processOrderDecision(managerId: any, string: any, orderId: any, string1: any, decision: any, arg5: number, arg6: any) {
  throw new Error('Function not implemented.');
}

