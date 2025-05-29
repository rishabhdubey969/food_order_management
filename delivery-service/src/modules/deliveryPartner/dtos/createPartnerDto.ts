import { VehicleType } from '../enums/partnerEnumA';
import { IsEnum, IsNotEmpty, IsString, IsEmail, IsMobilePhone, IsDateString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class CreateDeliveryPartnerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsMobilePhone()
  mobileNumber: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsDateString()
  dob: Date;

  @IsNotEmpty()
  @IsString()
  permanentAddress: string;

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsNotEmpty()
  vehicleDetails: {
    vehicleType: VehicleType;
    vehicleNumber: string;
    vehicleColor: string;
  };

  @IsNotEmpty()
  documents: {
    rc: string;
    aadhaar: string;
    dl: string;
  };
}