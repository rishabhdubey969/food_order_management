import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
  }

  async updateComplaintStatus(
    complaintId: string,
    dto: UpdateComplaintStatusDto,
    userId: string,
  ) {
    if (!isValidObjectId(complaintId)) {
      throw new BadRequestException('Invalid Complaint ID format');
    }

    // Get the complaint document
    const complaint = await this.connection
      .collection('complaints')
      .findOne({ _id: new Types.ObjectId(complaintId) });

    if (!complaint) {
      throw new NotFoundException(ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
    }

    // Verify associated order exists
    const order = await this.connection
      .collection('orders')
      .findOne({ _id: new Types.ObjectId(complaint.orderId) });

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Update complaint status
    await this.connection.collection('complaints').updateOne(
      { _id: new Types.ObjectId(complaintId) },
      {
        $set: {
          status: dto.status,
          updatedAt: new Date(),
        },
      },
    );

    // Email logic
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
  }

  // async getComplaintsForManager(managerId: string) {
  //   const complaints = await this.connection
  //     .collection('complaints')
  //     .find({ managerId })
  //     .project({ __v: 0 })
  //     .toArray();

  //   return {
  //     message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
  //     data: complaints,
  //   };
  // }
  async getComplaintsForManager(managerId: string) {
    // Validate managerId
    if (!Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Invalid manager ID');
    }

    // Query complaints for the specific manager
    const complaints = await this.connection
      .collection('complaints')
      .find({ managerId: new Types.ObjectId(managerId) })
      .project({ __v: 0 })
      .toArray();

    // Check if complaints exist
    if (!complaints.length) {
      throw new NotFoundException('No complaints found for this manager');
    }

    return {
      message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
      data: complaints,
    };
  }


  async getAllComplaints(token: string) {
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
  }
}
