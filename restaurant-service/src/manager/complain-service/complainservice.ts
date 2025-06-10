import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types,Model } from 'mongoose';
import { Complaint, ComplaintDocument } from 'src/manager/schema/complain.schema';
import { UpdateComplaintStatusDto } from 'src/manager/dto/update.complainStatusdto';
import { TokenService } from '../token/token.service';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { Order,OrderDocument } from '../schema/order.schema';

@Injectable()
export class ComplaintService {
  userModel: any;
  mailerService: any;
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<ComplaintDocument>,
      @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
      private readonly tokenService: TokenService,
  ) {}

    async createComplaint(dto: CreateComplaintDto, managerId: string) {
    const complaint = new this.complaintModel({
      ...dto,
      managerId,
    });
    return await complaint.save();
  }

//   async updateComplaintStatus(
//   complaintId: string, 
//   dto: UpdateComplaintStatusDto, userId: any,
//     // managerId: string,
//   ) {
//     const complaint = await this.complaintModel.findById(complaintId);
//     if (!complaint) throw new NotFoundException(ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
    
//    const orderExists = await this.orderModel.exists({ _id: complaint.orderId });
//   if (!orderExists) {
//     throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
//   }

// //order 
// //resto
// //manager
//     // if (complaint.managerId !== managerId) {
//     //   throw new ForbiddenException(ERROR_MESSAGES.ACCESS_DENIED);
//     // }

//     complaint.status = dto.status;
//     await complaint.save();

//     let emailSent = false;
//     try {
//       const user = await this.userModel.findById(complaint.userId);
//       if (user?.email) {
//         const subject =
//           dto.status === 'resolved'
//             ? 'Your complaint has been resolved'
//             : 'Your complaint was rejected';

//         const message =
//           dto.status === 'resolved'
//             ? 'Hello, your complaint has been successfully resolved by our manager.'
//             : 'Hello, unfortunately your complaint has been rejected by the manager.';

//         await this.mailerService.sendEmail(user.email, subject, `<p>${message}</p>`);
//         emailSent = true;
//       }
//     } catch (error) {
//       console.error(ERROR_MESSAGES.EMAIL_SEND_FAILED, error);
//     }

//     return {
//       message: SUCCESS_MESSAGES.COMPLAINT_STATUS_UPDATED,
//       details: emailSent ? SUCCESS_MESSAGES.EMAIL_SENT : ERROR_MESSAGES.EMAIL_SEND_FAILED,
//       data: complaint,
//     };
//   }

async updateComplaintStatus(
  complaintId: string,
  dto: UpdateComplaintStatusDto,
  userId: string,
) {
  try {
    
    if (!isValidObjectId(complaintId)) {
      throw new BadRequestException('Invalid Complaint ID format');
    }

    const complaint = await this.complaintModel.findById(complaintId);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const { orderId } = complaint;
    if (!isValidObjectId(orderId)) {
      throw new BadRequestException('Invalid Order ID format in Complaint');
    }

    const orderExists = await this.orderModel.exists({ 
      _id: new Types.ObjectId(orderId) 
    });

    if (!orderExists) {
      throw new NotFoundException('Associated Order not found');
    }

    complaint.status = dto.status;
    await complaint.save();

    let emailSent = false;
    try {
      const user = await this.userModel.findById(complaint.userId);
      if (user?.email) {
        const subject = dto.status === 'resolved'
          ? 'Your complaint has been resolved'
          : 'Your complaint was rejected';

        const message = dto.status === 'resolved'
          ? 'Hello, your complaint has been successfully resolved by our manager.'
          : 'Hello, unfortunately your complaint has been rejected by the manager.';

        await this.mailerService.sendEmail(
          user.email, 
          subject, 
          `<p>${message}</p>`
        );
        emailSent = true;
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    return {
      message: 'Complaint status updated successfully',
      details: emailSent 
        ? 'Notification email sent successfully' 
        : 'Failed to send notification email',
      data: complaint,
    };
  } catch (err) {
    console.error('Update complaint failed:', err);
    throw err; 
  }
}
  async getComplaintsForManager(managerId: string) {
    const complaints = await this.complaintModel.find({ managerId }).select('-__v');
    return {
      message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
      data: complaints,
    };
  }

  async getAllComplaints(token: string) {
    const user = await this.tokenService.verify(token);
    if (user.role !== 'admin') throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ONLY);
    
    const complaints = await this.complaintModel.find().select('-__v');
    return {
      message: SUCCESS_MESSAGES.COMPLAINTS_FETCHED,
      data: complaints,
    };
  }
}