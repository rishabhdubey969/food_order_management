import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateComplaintStatusDto {
  @ApiProperty({
    description: 'Status of the complaint',
    enum: ['resolved', 'rejected', 'refund'],
    example: 'resolved',
  })
  @IsIn(['resolved', 'rejected'], {
    message: 'Status must be either "resolved" or "rejected"',
  })
  status: 'resolved' | 'rejected' | 'refund';
}