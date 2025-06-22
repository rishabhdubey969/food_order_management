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
import { AdminGuard } from 'src/restaurant/guards/admin.guard';

@ApiBearerAuth('access-token')
@ApiTags('Complaints')
@UseGuards( JwtAuthGuard)
@Controller('complaints')
export class ComplaintController {
  tokenService: any;
  constructor(private readonly complaintService: ComplaintService) {}
  
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
  @Get('manager')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all complaints for this manager (Manager only)' })
  async getComplaintsForManager(@Req() req: any) {
    const id = req.user.sub;
    return this.complaintService.getComplaintsForManager(id);
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
