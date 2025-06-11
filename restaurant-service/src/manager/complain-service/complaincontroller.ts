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
import { UpdateComplaintStatusDto } from 'src/manager/dto/update.complainStatusdto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import {  JwtAuthGuard } from '../guard/authguard'; 
import { CreateComplaintDto } from '../dto/create-complaint.dto';

@ApiBearerAuth('access-token')
@ApiTags('Complaints')
@UseGuards( JwtAuthGuard)
@Controller('complaints')
export class ComplaintController {
  tokenService: any;
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
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
  async create(@Body() dto: CreateComplaintDto, @Req() req: any) {
    return this.complaintService.createComplaint(dto, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update complaint status (Manager only)' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiBody({ type: UpdateComplaintStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.complaintService.updateComplaintStatus(id, dto, user.userId);
  }

  @Get('manager')
  @ApiOperation({ summary: 'Get all complaints for this manager (Manager only)' })
  async getManagerComplaints(@Req() req: Request) {
    const user = req['user'];
    return this.complaintService.getComplaintsForManager(user.userId);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get all complaints with manager and restaurant info (Admin only)' })
  async getAllComplaints(@Req() req: Request) {
    const user = req['user'];
    return this.complaintService.getAllComplaints(user);
  }
}
