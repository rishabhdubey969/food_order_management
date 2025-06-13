import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types, isValidObjectId } from 'mongoose';
import { UpdateComplaintStatusDto } from 'src/manager/modules/auth/dto/update.complainStatusdto';
import { TokenService } from '../token/token.service';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { CreateComplaintDto } from '../auth/dto/create-complaint.dto';


@Injectable()
export class ComplaintService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    
  ) {}

  async createComplaint(dto: CreateComplaintDto, userId: string, managerId: string) {
    
      const complaint = {
        ...dto,
        userId,
        managerId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.connection.collection('complaints').insertOne(complaint);

      return {
        message: SUCCESS_MESSAGES.COMPLAINT_CREATED,
        data: result.insertedId,
      };
    } 
  
  async updateComplaintStatus(
    complaintId: string,
    dto: UpdateComplaintStatusDto,
    userId: string,
  ) {
    if (!isValidObjectId(complaintId)) {
      throw new BadRequestException('Invalid Complaint ID format');
    }

    try {
      const complaint = await this.connection
        .collection('complaints')
        .findOne({ _id: new Types.ObjectId(complaintId) });
        
      if (!complaint) {
        throw new NotFoundException(ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
      }
      console.log("Complaint ",complaint);
      const order = await this.connection
        .collection('orders')
        .findOne({ _id: new Types.ObjectId(complaint.orderId)});
        console.log(order);
      if (!order) {
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
      console.log("updated", updated);

    
    } catch (error) {
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to update complaint status');
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
        throw new NotFoundException('No complaints found for this manager');
      }

      return {
        message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
        data: complaints,
      };
    } catch (error) {
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to fetch complaints for manager');
    }
  }
}
