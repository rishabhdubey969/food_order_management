import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types, isValidObjectId } from 'mongoose';
import { UpdateComplaintStatusDto } from 'src/manager/dto/update.complainStatusdto';
import { TokenService } from '../token/token.service';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly mailerService: MailerService,
  ) {}

  async createComplaint(dto: CreateComplaintDto, managerId: string) {
    try {
      const complaint = {
        ...dto,
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to create complaint');
    }
  }
// async createComplaint(dto: CreateComplaintDto, managerId: string) {
//   try {
//     // Validate IDs
//     if (!isValidObjectId(dto.userId) ){
//       throw new BadRequestException('Invalid user ID format');
//     }
//     if (!isValidObjectId(dto.orderId)) {
//       throw new BadRequestException('Invalid order ID format');
//     }
//     // if (!isValidObjectId(managerId)) {
//     //   throw new BadRequestException('Invalid manager ID format');
//     // }

//     // Verify user exists
//     const userExists = await this.connection.collection('users').countDocuments({
//       _id: new Types.ObjectId(dto.userId)
//     });
//     if (!userExists) {
//       throw new NotFoundException('User not found');
//     }

//     // Verify order exists
    // const orderExists = await this.connection.collection('orders').countDocuments({
    //   _id: new Types.ObjectId(dto.orderId)
    // });
    // if (!orderExists) {
    //   throw new NotFoundException('Order not found');
    // }

    // const complaint = {
    //   userId: new Types.ObjectId(dto.userId),
    //   orderId: new Types.ObjectId(dto.orderId),
    //   managerId: new Types.ObjectId(managerId),
    //   description: dto.description,
    //   status: 'pending',
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // };

//     const result = await this.connection.collection('complaints').insertOne(complaint);

//     return {
//       message: SUCCESS_MESSAGES.COMPLAINT_CREATED,
//       data: {
//         complaintId: result.insertedId,
//         status: 'pending'
//       },
//     };
//   } catch (error) {
//     if (error instanceof HttpException) {
//       throw error;
//     }
//     throw new InternalServerErrorException('Failed to create complaint');
//   }
// }
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

      const order = await this.connection
        .collection('orders')
        .findOne({ _id: new Types.ObjectId(complaint.orderId) });

      if (!order) {
        throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      await this.connection.collection('complaints').updateOne(
        { _id: new Types.ObjectId(complaintId) },
        {
          $set: {
            status: dto.status,
            updatedAt: new Date(),
          },
        },
      );

      let emailSent = false;
      try {
        const user = await this.connection
          .collection('users')
          .findOne({ _id: new Types.ObjectId(complaint.userId) });

        if (user?.email) {
          const subject =
            dto.status === 'resolved'
              ? 'Your complaint has been resolved'
              : 'Your complaint was rejected';

          const message =
            dto.status === 'resolved'
              ? 'Hello, your complaint has been successfully resolved by our manager.'
              : 'Hello, unfortunately your complaint has been rejected by the manager.';

          await this.mailerService.sendMail({
            to: user.email,
            subject,
            html: `<p>${message}</p>`,
          });

          emailSent = true;
        }
      } catch (error) {
        console.error(ERROR_MESSAGES.EMAIL_SEND_FAILED, error);
      }

      return {
        message: SUCCESS_MESSAGES.COMPLAINT_STATUS_UPDATED,
        details: emailSent
          ? SUCCESS_MESSAGES.EMAIL_SENT
          : ERROR_MESSAGES.EMAIL_SEND_FAILED,
        data: { _id: complaintId, status: dto.status },
      };
    } catch (error) {
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to update complaint status');
    }
  }

  async getComplaintsForManager(managerId: string) {
    if (!Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Invalid manager ID');
    }

    try {
      const complaints = await this.connection
        .collection('complaints')
        .find({ managerId: new Types.ObjectId(managerId) })
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

  async getAllComplaints(token: string) {
    try {
      const user = await this.tokenService.verify(token);
      if (user.role !== 'admin') {
        throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ONLY);
      }

      const complaints = await this.connection
        .collection('complaints')
        .find()
        .project({ __v: 0 })
        .toArray();

      return {
        message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
        data: complaints,
      };
    } catch (error) {
      throw error instanceof ForbiddenException
        ? error
        : new InternalServerErrorException('Failed to fetch all complaints');
    }
  }
}
