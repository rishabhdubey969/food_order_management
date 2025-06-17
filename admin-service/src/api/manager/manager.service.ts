import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { AuthService } from '../auth/auth.service';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';

import { ObjectId } from 'mongodb';
import { lastValueFrom, Observable } from 'rxjs';
import { WinstonLogger } from '../logger/winston-logger.service';

interface ManagerServiceGrpc {
  Signup(data: GetSignUpRequest): Observable<GetSignUpResponse>;
}

export interface GetSignUpRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  restaurant_id: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}
export interface GetSignUpResponse {
  message: String;
  data: ManagerData;
}

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
export class ManagerService implements OnModuleInit {
  // private readonly logger = new Logger(ManagerService.name);
  private managerServiceGrpc: ManagerServiceGrpc;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly authService: AuthService,
    // @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    @Inject('MANAGER_PACKAGE') private managerClient: ClientGrpc,
    private readonly logger: WinstonLogger,
  ) {}

  onModuleInit() {
    this.managerServiceGrpc =
      this.managerClient.getService<ManagerServiceGrpc>('ManagerService');
    this.logger.log(
      `gRPC Client Initialized with Methods: ${Object.keys(this.managerServiceGrpc).join(', ')}`,
    );
  }

  async signup(dto: GetSignUpRequest): Promise<GetSignUpResponse> {
    try {
      this.logger.log(`Sending signup request: ${JSON.stringify(dto)}`);
      const response = await lastValueFrom(this.managerServiceGrpc.Signup(dto));
      this.logger.log(`Signup successful for user: ${dto.email}`);
      return response;
    } catch (error) {
      this.logger.error(`Signup failed: ${error.message}`, error.stack);
      throw new RpcException(`Failed to sign up: ${error.message}`);
    }
  }

  async blockRestaurant(restaurantId: string) {
    this.logger.log(`Attempting to block restaurant ${restaurantId}`);

    const restaurant = await this.connection
      .collection('restaurants')
      .findOne({ _id: new ObjectId(restaurantId) });

    if (!restaurant) {
      this.logger.warn(`Restaurant ${restaurantId} not found `);
      throw new HttpException('Restaurant not found ', HttpStatus.NOT_FOUND);
    }

    const updates: Promise<any>[] = [];
    const messages: string[] = [];

    if (!restaurant.isBlocked) {
      updates.push(
        this.connection
          .collection('restaurants')
          .updateOne(
            { _id: new ObjectId(restaurantId) },
            { $set: { isBlocked: true } },
          ),
      );
      messages.push(`restaurant ${restaurantId}`);
    } else {
      this.logger.log(
        `Restaurant ${restaurantId} is already blocked, skipping`,
      );
    }

    if (updates.length === 0) {
      this.logger.warn(`restaurant ${restaurantId} are already blocked `);
      throw new HttpException(
        'Manager and restaurant are already blocked',
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all(updates);

    const message = `${messages.join(' and ')} have been blocked`;
    this.logger.log(message);

    //   const manager = await this.connection
    //     .collection('managers')
    //     .findOne({ _id: restaurant.managerId });
    //     console.log(manager);
    //   // Send email notification to the manager
    //   this.client.emit('send_email', {
    //     to: manager!.email,
    //     subject: 'Your Manager Account and Restaurant Have Been Blocked',
    //     html: `<p>${messages.join(' and ')} have been blocked by an admin. Please contact support for more information.</p>`,
    //   });
    //   this.logger.log(`Block notification email emitted for ${manager!.email}`);

    //   return { message };
    // } catch (error) {
    //   this.logger.error(
    //     error.stack,
    //   );
    //   throw new HttpException(
    //     error.message || 'Failed to block manager and restaurant',
    //     error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    //   );
  }

  async getAllManagers(token: string, page: number = 1, limit: number = 10) {
    this.logger.log(
      `Fetching list of managers with pagination - page: ${page}, limit: ${limit}`,
    );
    try {
      let payload;
      payload = await this.authService.verifyJwtToken(token);
      if (payload.role !== 'admin') {
        this.logger.warn(
          `Unauthorized access attempt by role: ${payload.role}`,
        );
        throw new UnauthorizedException('Only admins can access this endpoint');
      }

      let pageNum, limitNum;
      pageNum = Math.max(1, page);
      limitNum = Math.max(1, Math.min(limit, 100));
      const skip = (pageNum - 1) * limitNum;

      let managers;
      managers = await this.connection
        .collection('managers')
        .find({ isActiveManager: false })
        .project({ _id: 1, email: 1, username: 1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      let total;
      total = await this.connection
        .collection('managers')
        .countDocuments({ role: 3, isActiveManager: false });

      let totalPages;
      totalPages = Math.ceil(total / limitNum);

      return {
        data: managers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch managers: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to fetch managers',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async softDeleteRestaurant(restaurantId: string) {
    this.logger.log(`Attempting to soft delete restaurant ${restaurantId}`);

    const restaurant = await this.connection
      .collection('restaurants')
      .findOne({ _id: new ObjectId(restaurantId) });

    if (!restaurant) {
      this.logger.warn(`Restaurant ${restaurantId} not found `);
      throw new HttpException('Restaurant not found ', HttpStatus.NOT_FOUND);
    }

    const updates: Promise<any>[] = [];
    const messages: string[] = [];

    if (!restaurant.isDeleted) {
      updates.push(
        this.connection.collection('restaurants').updateOne(
          { _id: new ObjectId(restaurantId) },
          {
            $set: {
              isDeleted: true,
              DeletedAt: new Date(),
            },
          },
        ),
      );
      messages.push(`restaurant ${restaurantId}`);
    } else {
      this.logger.log(
        `Restaurant ${restaurantId} is already deactivated, skipping`,
      );
    }

    if (updates.length === 0) {
      this.logger.warn(`Restaurant ${restaurantId} are already deleted`);
      throw new HttpException(
        'Restaurant are already deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all(updates);

    const message = `${messages.join(' and ')} have been soft deleted`;
    this.logger.log(message);

    //   // Send email notification to the manager
    //   this.client.emit('send_email', {
    //     to: manager.email,
    //     subject: 'Your Manager Account and Restaurant Have Been Deleted',
    //     html: `<p>${messages.join(' and ')} have been soft deleted by an admin. Please contact support for more information.</p>`,
    //   });
    //   this.logger.log(`Delete notification email emitted for ${manager.email}`);

    return { message };
    // } catch (error) {
    //   this.logger.error(
    //     `Failed to soft delete manager ${managerId} and restaurant ${restaurantId}: ${error.message}`,
    //     error.stack,
    //   );
    //   throw new HttpException(
    //     error.message || 'Failed to soft delete manager and restaurant',
    //     error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    //   );
    // }
  }

  async ValidateManager(managerId: string) {
    this.logger.log(`Attempting to Validate  MAnager ${managerId}`);

    const manager = await this.connection
      .collection('managers')
      .findOne({ _id: new ObjectId(managerId) });

    if (!manager) {
      this.logger.warn(`Manager ${managerId} not found `);
      throw new HttpException('Manager not found ', HttpStatus.NOT_FOUND);
    }

    const updates: Promise<any>[] = [];
    const messages: string[] = [];

    if (!manager.isActiveManager) {
      updates.push(
        this.connection
          .collection('managers')
          .updateOne(
            { _id: new ObjectId(managerId) },
            { $set: { isActiveManager: true } },
          ),
      );
      messages.push(`restaurant ${managerId}`);
    } else {
      this.logger.log(`Manager ${managerId} is Validated`);
    }

    if (updates.length === 0) {
      this.logger.warn(`manager ${managerId} are validated`);
      throw new HttpException(
        'Manager are already validated',
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all(updates);
     const message = `${messages.join(' and ')} have been validated`;
    this.logger.log(message);
     return { message };
  } 
  
  
  async InValidateManager(managerId: string) {
    this.logger.log(`Attempting to INValidate  MAnager ${managerId}`);

    const manager = await this.connection
      .collection('managers')
      .findOne({ _id: new ObjectId(managerId) });

    if (!manager) {
      this.logger.warn(`Manager ${managerId} not found `);
      throw new HttpException('Manager not found ', HttpStatus.NOT_FOUND);
    }

    const updates: Promise<any>[] = [];
    const messages: string[] = [];

    if (manager.isActiveManager) {
      updates.push(
        this.connection
          .collection('managers')
          .updateOne(
            { _id: new ObjectId(managerId) },
            { $set: { isActiveManager:false } },
          ),
      );
      messages.push(`restaurant ${managerId}`);
    } else {
      this.logger.log(`Manager ${managerId} is Invalidated`);
    }

    if (updates.length === 0) {
      this.logger.warn(`manager ${managerId} are already Invalidated`);
      throw new HttpException(
        'Manager are already Invalidated',
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all(updates);
    const message = `${messages.join(' and ')} have been invalidated`;
    this.logger.log(message);
     return { message };
  }
}
