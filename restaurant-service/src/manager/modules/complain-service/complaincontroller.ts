import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ComplaintService } from './complainservice';
import { UpdateComplaintStatusDto } from 'src/manager/modules/complain-service/dto/update.complainStatusdto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import {  JwtAuthGuard } from '../auth/guards/jwtauthguard'; 
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { AdminGuard } from 'src/restaurant/guards/admin.guard';

@ApiBearerAuth('access-token')
@ApiTags('Complaints')
@UseGuards( JwtAuthGuard)
@Controller('complaints')
export class ComplaintController {
  tokenService: any;
  constructor(private readonly complaintService: ComplaintService) {}
  
  /**
 * Handles creation of a new user complaint
 * 
 * @param createComplaintDto - Complaint details including:
 *           - orderId: string (related order reference)
 *           - complaintType: enum (QUALITY, DELIVERY, SERVICE)
 *           - description: string (detailed complaint reason)
 *           - attachments?: string[] (optional image URLs)
 * 
 * @returns Promise<ComplaintReceipt> - Contains:
 *           - complaintId: string
 *           - status: string (PENDING/IN_REVIEW/RESOLVED)
 *           - createdAt: Date
 *           - estimatedResolutionTime?: Date
 */
  @Post('/:managerId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new complaint (User only)' })
  @ApiBody({
    description: 'Details of the complaint to be created',
    type: CreateComplaintDto,
    examples: {
      example1: {
        summary: 'Sample complaint',
        value: {
          userId: '682adb9df49146b3a410e478',
          orderId: '683d8e4d15f9ab39583eef4f',
          description: 'The food was delivered late and was cold.',
        },
      },
    },
  })
  async create(@Body() dto: CreateComplaintDto, @Req() req: any, @Param('managerId') managerId : string) {
    console.log(req.user.userId);
    return this.complaintService.createComplaint(dto, req.user.userId, managerId);
  }

  /**
 * Updates the status/resolution of a user complaint (Manager Only)
 * 
 * @param complaintId - The unique identifier of the complaint ticket
 * @param updateComplaintDto - Update details including:
 *           - status: enum (IN_REVIEW, RESOLVED, REJECTED)
 *           - resolution?: string (required if status=RESOLVED)
 *           - managerNotes?: string (internal comments)
 * 
 * @returns Promise<UpdatedComplaint> - Contains:
 *           - complaintId: string
 *           - previousStatus: string
 *           - newStatus: string
 *           - updatedAt: Date
 *           - resolution?: string
 */
  @Patch('status/:id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update complaint status (Manager only)' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiBody({ type: UpdateComplaintStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @Req() req: any,
  ) {
    const user = req['user'];
    return this.complaintService.updateComplaintStatus(id, dto, user.userId);
  }
  
 /**
 * Retrieves a specific complaint belonging to the manager's restaurant
 * 
 * @param complaintId - The unique identifier of the complaint
 * @param managerId - The authenticated manager's ID (from JWT)
 * @returns Promise<RestaurantComplaintDetails> - Detailed complaint object including:
 *           - complaint: Complaint details
 *           - order: Related order summary
 *           - customer: Basic customer info
 *           - timeline: Status change history
 */
  @Get('manager/:managerId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all complaints for this manager (Manager only)' })
  async getManagerComplaints(@Param('managerId') managerId: string) {
    return this.complaintService.getComplaintsForManager(managerId);
  }
  
  /**
   * Admin gets complaint related to each manager's restaurant
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all complaints with manager and restaurant info (Admin only)' })
  async getAllComplaints(@Req() req: Request) {
    const user = req['user'];
    console.log("Controller", user);
    return this.complaintService.getAllComplaints(user);
  }
}
