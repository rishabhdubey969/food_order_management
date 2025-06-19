import { VehicleType } from '../../deliveryPartner/enums/partnerEnum';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsDateString,
  ValidateNested, // Import ValidateNested for nested objects
  IsEnum, // Import IsEnum for enum validation
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty
import { Type } from 'class-transformer'; // Import Type for nested object transformation

// Define nested DTOs for better structure and documentation
class VehicleDetailsDto {
  @ApiProperty({
    enum: VehicleType,
    description: 'Type of vehicle (e.g., BIKE, CAR, CYCLE)',
    example: VehicleType.BIKE,
  })
  @IsNotEmpty()
  @IsEnum(VehicleType, { message: 'Vehicle type must be a valid VehicleType enum value' })
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Vehicle registration number',
    example: 'DL12AB3456',
    minLength: 5,
  })
  @IsNotEmpty()
  @IsString()
  vehicleNumber: string;

  @ApiProperty({
    description: 'Color of the vehicle',
    example: 'Red',
  })
  @IsNotEmpty()
  @IsString()
  vehicleColor: string;
}

class DocumentsDto {
  @ApiProperty({
    description: 'RC (Registration Certificate) document URL or ID',
    example: 'https://example.com/rc_doc_id_123',
  })
  @IsNotEmpty()
  @IsString()
  rc: string;

  @ApiProperty({
    description: 'Aadhaar document URL or ID',
    example: 'https://example.com/aadhaar_doc_id_456',
  })
  @IsNotEmpty()
  @IsString()
  aadhaar: string;

  @ApiProperty({
    description: 'Driving License (DL) document URL or ID',
    example: 'https://example.com/dl_doc_id_789',
  })
  @IsNotEmpty()
  @IsString()
  dl: string;
}

export class RegisterPartnerDto {
  @ApiProperty({
    description: 'Full name of the delivery partner',
    example: 'John Doe',
  })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  // @ApiProperty({
  //   description: 'Email address of the delivery partner',
  //   example: 'john.doe@example.com',
  //   format: 'email',
  // })
  // @IsNotEmpty({ message: 'Email cannot be empty' })
  // @IsEmail({}, { message: 'Please provide a valid email address' })
  // email: string;

  @ApiProperty({
    description: 'Mobile number of the delivery partner',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Mobile number cannot be empty' })
  mobileNumber: string;

  @ApiProperty({
    description: 'Password for the delivery partner account (min 8 characters)',
    example: 'StrongPass@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  // Add more robust password validation if needed (e.g., regex for complexity)
  password: string;

  @ApiProperty({
    description: 'Date of birth of the delivery partner (YYYY-MM-DD format)',
    example: '1990-01-15',
    format: 'date',
  })
  @IsNotEmpty({ message: 'Date of birth cannot be empty' })
  @IsDateString({}, { message: 'Please provide a valid date string for DOB' })
  dob: Date;

  @ApiProperty({
    description: 'Permanent address of the delivery partner',
    example: '123 Main St, Anytown, State, 123456',
  })
  @IsNotEmpty({ message: 'Permanent address cannot be empty' })
  @IsString({ message: 'Permanent address must be a string' })
  permanentAddress: string;

  @ApiProperty({
    description: 'Details of the vehicle used for deliveries',
    type: VehicleDetailsDto, // Link nested DTO for Swagger
  })
  @IsNotEmpty({ message: 'Vehicle details cannot be empty' })
  @ValidateNested() // Enable validation for nested object
  @Type(() => VehicleDetailsDto) // Ensure class-transformer knows the type of nested object
  vehicleDetails: VehicleDetailsDto;

  @ApiProperty({
    description: 'Document details (e.g., RC, Aadhaar, DL URLs/IDs)',
    type: DocumentsDto, // Link nested DTO for Swagger
  })
  @IsNotEmpty({ message: 'Documents cannot be empty' })
  @ValidateNested() // Enable validation for nested object
  @Type(() => DocumentsDto) // Ensure class-transformer knows the type of nested object
  documents: DocumentsDto;
}