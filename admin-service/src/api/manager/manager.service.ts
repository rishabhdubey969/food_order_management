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

// interface ManagerServiceGrpc {
//   Signup(data: GetSignUpRequest): Observable<GetSignUpResponse>;
// }

// export interface GetSignUpRequest {
//   name: string;
//   email: string;
//   phone: string;
//   password: string;
//   restaurant_id: string;
//   account_number: string;
//   ifsc_code: string;
//   bank_name: string;
// }
// export interface GetSignUpResponse {
//   message: String;
//   data: ManagerData;
// }

// export interface ManagerData {
//   id: String;
//   name: String;
//   email: String;
//   phone: String;
//   password: String;
//   restaurantId: String;
//   accountNumber: String;
//   ifscCode: String;
//   bankName: String;
// }

@Injectable()
export class ManagerService {
//implements OnModuleInit {
 
  // private managerServiceGrpc: ManagerServiceGrpc;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly authService: AuthService,
  
    @Inject('MANAGER_PACKAGE') private managerClient: ClientGrpc,
    private readonly logger: WinstonLogger,
  ) {}

  // onModuleInit() {
  //   this.managerServiceGrpc =
  //     this.managerClient.getService<ManagerServiceGrpc>('ManagerService');
  //   this.logger.log(
  //     `gRPC Client Initialized with Methods: ${Object.keys(this.managerServiceGrpc).join(', ')}`,
  //   );
  // }

  // async signup(dto: GetSignUpRequest): Promise<GetSignUpResponse> {
  //   try {
  //     this.logger.log(`Sending signup request: ${JSON.stringify(dto)}`);
  //     const response = await lastValueFrom(this.managerServiceGrpc.Signup(dto));
  //     this.logger.log(`Signup successful for user: ${dto.email}`);
  //     return response;
  //   } catch (error) {
  //     this.logger.error(`Signup failed: ${error.message}`, error.stack);
  //     throw new RpcException(`Failed to sign up: ${error.message}`);
  //   }
  // }

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
    return message;

   
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



    return {message};
 
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
  const message = true;
    



    return message;
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
     const message = false;

    return message;
  }
  async getRestaurants(
    adminId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
      isBlocked?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const logger = { log: console.log, error: console.error }; // Replace with actual logger
    logger.log(`Admin ${adminId} fetching restaurants with filters: ${JSON.stringify(filters)}`);
    try {
      const {
        startDate,
        endDate,
        isActive,
        isBlocked,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = filters;

      const query: any = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // is_active filter
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      // blocked filter
      if (isBlocked !== undefined) {
        query.isBlocked = isBlocked;
      }

      // Search filter (name or description)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Sorting
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (page - 1) * limit;

      const [restaurants, totalRestaurants] = await Promise.all([
        this.connection
          .collection('restaurants')
          .find(query, { projection: { managerId: 1, name: 1, description: 1, address: 1, phone: 1, is_active: 1, blocked: 1, createdAt: 1, updatedAt: 1 } }) // Include relevant fields
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.connection.collection('restaurants').countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalRestaurants / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.log(`Admin ${adminId} fetched ${restaurants.length} restaurants (page ${page})`);
      return {
        restaurants,
        totalRestaurants,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        filters: { startDate, endDate, isActive, isBlocked, search, sortBy, sortOrder },
      };
    } catch (error) {
      logger.error(`Admin ${adminId} failed to fetch restaurants: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch restaurants',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getManagers(
    adminId: string,
    filters: {
      startDate?: string;
      endDate?: string;
  
      isblocked?: boolean;
      isActiveManager?: boolean; // Additional filter for manager status
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const logger = { log: console.log, error: console.error }; // Replace with actual logger
    logger.log(`Admin ${adminId} fetching managers with filters: ${JSON.stringify(filters)}`);
    try {
      const {
        startDate,
        endDate,
     
        isblocked,
        isActiveManager,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = filters;

      const query: any = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) query.createdAt.$lte = new Date(`${endDate}T00:00:00.000Z`);
      }

     
      // blocked filter
      if (isblocked !== undefined) {
        query.isblocked = isblocked;
      }

      // isActiveManager filter
      if (isActiveManager !== undefined) {
        query.isActiveManager = isActiveManager;
      }

      // Search filter (name or email)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Sorting
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (page - 1) * limit;

      const [managers, totalManagers] = await Promise.all([
        this.connection
          .collection('managers')
          .find(query, { projection: { password: 0 } }) // Exclude sensitive fields
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.connection.collection('managers').countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalManagers / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.log(`Admin ${adminId} fetched ${managers.length} managers (page ${page})`);
      return {
        managers,
        totalManagers,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        filters: { startDate, endDate, isblocked, isActiveManager, search, sortBy, sortOrder },
      };
    } catch (error) {
      logger.error(`Admin ${adminId} failed to fetch managers: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch managers',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
