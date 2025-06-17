import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types, isValidObjectId } from 'mongoose';
import { UpdateComplaintStatusDto } from 'src/manager/modules/complain-service/dto/update.complainStatusdto';
import { TokenService } from '../token/token.service';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { WinstonLogger } from 'src/logger/winston-logger.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly logger: WinstonLogger,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async createComplaint(dto: CreateComplaintDto, userId: string, managerId: string) {
    try {
      const complaint = {
        ...dto,
        managerId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.connection.collection('complaints').insertOne(complaint);

      this.logger.log(`Complaint created successfully by user ${userId} for manager ${managerId}`);

      return {
        message: SUCCESS_MESSAGES.COMPLAINT_CREATED,
        data: result.insertedId,
      };
    } catch (error) {
      this.logger.error(`Failed to create complaint by user ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to create complaint');
    }
  }

  async updateComplaintStatus(
    complaintId: string,
    dto: UpdateComplaintStatusDto,
    userId: string,
  ) {
    if (!isValidObjectId(complaintId)) {
      this.logger.warn(`Invalid complaint ID format: ${complaintId}`);
      throw new BadRequestException('Invalid Complaint ID format');
    }

    try {
      const complaint = await this.connection
        .collection('complaints')
        .findOne({ _id: new Types.ObjectId(complaintId) });

      if (!complaint) {
        this.logger.warn(`Complaint not found: ${complaintId}`);
        throw new NotFoundException(ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
      }

      const order = await this.connection
        .collection('orders')
        .findOne({ _id: new Types.ObjectId(complaint.orderId) });

      if (!order) {
        this.logger.warn(`Order not found for complaint: ${complaintId}`);
        throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      const updated = await this.connection.collection('complaints').updateOne(
        { _id: new Types.ObjectId(complaintId) },
        {
          $set: {
            status: dto.status,
            updatedAt: new Date(),
          },
        },
      );

      this.logger.log(`Complaint ${complaintId} updated to status "${dto.status}" by user ${userId}`);

      await this.emitComplaintNotification(complaint.managerId, userId,dto.status);

  return {
  message: SUCCESS_MESSAGES.COMPLAINT_STATUS_UPDATED,
  data: { updatedCount: updated.modifiedCount },
  };
    } catch (error) {
      this.logger.error(`Failed to update complaint ${complaintId} by user ${userId}`, error.stack);
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to update complaint status');
    }
  }
    async emitComplaintNotification(managerId: string, userId: string, status: string) {
    try {
     
      const manager = await this.connection
        .collection('managers')
        .findOne({ _id: new Types.ObjectId(managerId) });
  
      if (!manager || !manager.restaurantId) {
        this.logger.warn(`Manager or restaurant not found for managerId: ${managerId}`);
        return;
      }
  
      const restaurant = await this.connection
        .collection('restaurants')
        .findOne({ _id: new Types.ObjectId(manager.restaurantId) });
  
      if (!restaurant) {
        this.logger.warn(`Restaurant not found for id: ${manager.restaurantId}`);
        return;
      }
  
      const user = await this.connection
        .collection('users')
        .findOne({ _id: new Types.ObjectId(userId) });
  
      if (!user) {
        this.logger.warn(`User not found for id: ${userId}`);
        return;
      }
  
      const payload = {
        restaurantName: restaurant.name,
        restaurantEmail: restaurant.email,
        managerEmail: manager.email,
        userName: user.name,
        userEmail: user.email,
        complaintStatus: status,
      };
  
      this.logger.log(`Emitting complaint notification: ${JSON.stringify(payload)}`);
  
      this.rabbitMQService.emit('complaint_notification', payload);
    } catch (error) {
      this.logger.error('Error while emitting complaint notification', error.stack);
    }
  }


  async getComplaintsForManager(managerId: string) {
    try {
      const complaints = await this.connection
        .collection('complaints')
        .find({ managerId: managerId })
        .project({ __v: 0 })
        .toArray();

      if (!complaints.length) {
        this.logger.warn(`No complaints found for manager: ${managerId}`);
        throw new NotFoundException('No complaints found for this manager');
      }

      this.logger.log(`Complaints fetched for manager: ${managerId}`);
      return {
        message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
        data: complaints,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch complaints for manager ${managerId}`, error.stack);
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to fetch complaints for manager');
    }
  }

  async getAllComplaints(token: string) {
    try {
      const user = await this.tokenService.verify(token);

      if (user.role !== 'admin') {
        this.logger.warn(`Unauthorized access attempt by ${user.email || 'unknown'} to fetch all complaints`);
        throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ONLY);
      }

      const complaints = await this.connection
        .collection('complaints')
        .find()
        .project({ __v: 0 })
        .toArray();

      this.logger.log(`Admin fetched all complaints`);

      return {
        message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
        data: complaints,
      };
    } catch (error) {
      this.logger.error('Failed to fetch all complaints', error.stack);
      throw error instanceof ForbiddenException
        ? error
        : new InternalServerErrorException('Failed to fetch all complaints');
    }
  }
}

