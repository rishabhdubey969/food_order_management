import { IsNotEmpty, IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ComplainStatus } from '../complain-status.enum'; // Adjust the import path as necessary

export class CreateComplainDto {

  @ApiProperty({ example: 'orderId', description: 'User order Id' })
  @IsNotEmpty()
  @IsString()
  readonly orderId: string;

  @ApiProperty({ example: 'please add some description', description: 'User description' })
  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @ApiProperty({
    description: 'User complaint status',
    example: ComplainStatus.Pending,
    enum: ComplainStatus,
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsString({ message: 'Status must be a string' })
  @IsEnum(ComplainStatus, {
    message: `Status must be one of: ${Object.values(ComplainStatus).join(', ')}`,
  })
  readonly status: ComplainStatus;
}
