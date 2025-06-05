import { Injectable, Logger, HttpException, HttpStatus, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Manager } from './entities/manager.entity';
import { AuthService } from '../auth/auth.service';
import { ClientProxy } from '@nestjs/microservices';
import { Restaurant } from './entities/restaurant.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(
    // @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    // @InjectModel(Restaurant.name) private readonly restaurantModel: Model<Restaurant>,
    @InjectConnection() private readonly connection: Connection,
    private readonly authService: AuthService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

   async blockManagerAndRestaurant(managerId: string, restaurantId: string) {
    this.logger.log(`Attempting to block manager ${managerId} and restaurant ${restaurantId}`);
    try {
      // Validate manager
      const manager = await this.connection.collection('managers').findOne({ _id: new ObjectId(managerId), isdeleted: false });
      if (!manager) {
        this.logger.warn(`Manager not found for ID: ${managerId}`);
        throw new HttpException('Manager not found', HttpStatus.NOT_FOUND);
      }

   

      // Validate restaurant and its association with the manager
      const restaurant = await this.connection.collection("restaurants")
        .findOne({ _id: new ObjectId(restaurantId)})
        
      if (!restaurant) {
        this.logger.warn(`Restaurant ${restaurantId} not found or not associated with manager ${managerId}`);
        throw new HttpException('Restaurant not found or not associated with this manager', HttpStatus.NOT_FOUND);
      }


      console.log(managerId);
      // Determine what needs to be blocked
      const updates: Promise<any>[] = [];
      const messages: string[] = [];

      if (!manager.isblocked) {
        updates.push(
          this.connection.collection("managers").updateOne(
            { _id: new ObjectId(managerId) },
            { $set: { is: true } }
          )
        );
        messages.push(`Manager ${managerId}`);
      } else {
        this.logger.log(`Manager ${managerId} is already blocked, skipping`);
      }

      if (restaurant.isActive) {
        updates.push(
          this.connection.collection("restaurants").updateOne(
            { _id: new ObjectId(restaurantId) },
            { $set: { isActiveManager: false } }
          )
        );
        messages.push(`restaurant ${restaurantId}`);
      } else {
        this.logger.log(`Restaurant ${restaurantId} is already blocked, skipping`);
      }

      if (updates.length === 0) {
        this.logger.warn(`Manager ${managerId} and restaurant ${restaurantId} are already blocked`);
        throw new HttpException('Manager and restaurant are already blocked', HttpStatus.BAD_REQUEST);
      }

      // Execute the updates
      await Promise.all(updates);

      const message = `${messages.join(' and ')} have been blocked`;
      this.logger.log(message);

      // Send email notification to the manager
      try {
        this.client.emit('send_email', {
          to: manager.email,
          subject: 'Your Manager Account and Restaurant Have Been Blocked',
          html: `<p>${messages.join(' and ')} have been blocked by an admin. Please contact support for more information.</p>`,
        });
        this.logger.log(`Block notification email emitted for ${manager.email}`);
      } catch (error) {
        this.logger.error(`Failed to emit block notification email: ${error.message}`, error.stack);
      }

      return { message };
    } catch (error) {
      this.logger.error(`Failed to block manager ${managerId} and restaurant ${restaurantId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to block manager and restaurant',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
 async unblockManagerAndRestaurant(managerId: string, restaurantId: string, adminId: string) {
    this.logger.log(`Attempting to unblock manager ${managerId} and restaurant ${restaurantId} by admin: ${adminId}`);
    try {
      // Validate manager
      const manager = await this.connection.collection("managers")
        .findOne({ _id: new ObjectId(managerId), is_deleted: false })
     
      if (!manager) {
        this.logger.warn(`Manager not found for ID: ${managerId}`);
        throw new HttpException('Manager not found', HttpStatus.NOT_FOUND);
      }

      if (managerId === adminId) {
        this.logger.warn(`Admin ${adminId} attempted to unblock themselves`);
        throw new HttpException('Admins cannot unblock themselves', HttpStatus.BAD_REQUEST);
      }

      // Validate restaurant and its association with the manager
      const restaurant = await this.connection.collection("restaurants")
        .findOne({ _id: new ObjectId(restaurantId), managerId, is_deleted: false })
        
      if (!restaurant) {
        this.logger.warn(`Restaurant ${restaurantId} not found or not associated with manager ${managerId}`);
        throw new HttpException('Restaurant not found or not associated with this manager', HttpStatus.NOT_FOUND);
      }

      // Determine what needs to be unblocked
      const updates: Promise<any>[] = [];
      const messages: string[] = [];

      if (!manager.is_active) {
        updates.push(
          this.connection.collection("managers").updateOne(
            { _id: new ObjectId(managerId) },
            { $set: { is_active: true } }
          )
        );
        messages.push(`Manager ${managerId}`);
      } else {
        this.logger.log(`Manager ${managerId} is already unblocked, skipping`);
      }

      if (!restaurant.is_active) {
        updates.push(
          this.connection.collection("restaurants").updateOne(
            { _id: new ObjectId(restaurantId) },
            { $set: { is_active: true } }
          )
        );
        messages.push(`restaurant ${restaurantId}`);
      } else {
        this.logger.log(`Restaurant ${restaurantId} is already unblocked, skipping`);
      }

      if (updates.length === 0) {
        this.logger.warn(`Manager ${managerId} and restaurant ${restaurantId} are already unblocked`);
        throw new HttpException('Manager and restaurant are already unblocked', HttpStatus.BAD_REQUEST);
      }

      // Execute the updates
      await Promise.all(updates);

      const message = `${messages.join(' and ')} have been unblocked`;
      this.logger.log(message);

      // Send email notification to the manager
      try {
        this.client.emit('send_email', {
          to: manager.email,
          subject: 'Your Manager Account and Restaurant Have Been Unblocked',
          html: `<p>${messages.join(' and ')} have been unblocked by an admin. You can now access your account and manage your restaurant.</p>`,
        });
        this.logger.log(`Unblock notification email emitted for ${manager.email}`);
      } catch (error) {
        this.logger.error(`Failed to emit unblock notification email: ${error.message}`, error.stack);
      }

      return { message };
    } catch (error) {
      this.logger.error(`Failed to unblock manager ${managerId} and restaurant ${restaurantId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to unblock manager and restaurant',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
    




  async getAllManagers(token: string, page: number = 1, limit: number = 10) {
    this.logger.log(`Fetching list of managers with pagination - page: ${page}, limit: ${limit}`);
    try {
      let payload;
      try {
        payload = await this.authService.verifyJwtToken(token);
      } catch (error) {
        this.logger.error(`Token verification failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }

      try {
        if (payload.role !== 'admin') {
          this.logger.warn(`Unauthorized access attempt by role: ${payload.role}`);
          throw new UnauthorizedException('Only admins can access this endpoint');
        }
      } catch (error) {
        this.logger.error(`Role check failed: ${error.message}`, error.stack);
        throw new HttpException(
          error.message || 'Only admins can access this endpoint',
          HttpStatus.UNAUTHORIZED,
        );
      }

      let pageNum, limitNum;
      try {
        pageNum = Math.max(1, page);
        limitNum = Math.max(1, Math.min(limit, 100));
      } catch (error) {
        
        this.logger.error(`Pagination parameter validation failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid pagination parameters', HttpStatus.BAD_REQUEST);
      }

      const skip = (pageNum - 1) * limitNum;

      let managers;
      try {
        
        managers = await this.connection.collection('managers')
          .find({ isActiveManager: false })
          .project({ _id: 1, email: 1, username: 1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();
          console.log(managers)
      } catch (error) {
        
        this.logger.error(`Manager query failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch managers', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let total;
      try {

        total = await this.connection.collection("managers")
          .countDocuments({ role: 3, isActiveManager:false});
      } catch (error) {
        
        
        this.logger.error(`Count query failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch managers', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let totalPages;
      try {
        totalPages = Math.ceil(total / limitNum);
      } catch (error) {
        this.logger.error(`Pagination calculation failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch managers', HttpStatus.INTERNAL_SERVER_ERROR);
      }


        
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
      this.logger.error(`Failed to fetch managers: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch managers',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}