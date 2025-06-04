import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { PartnerStatus } from '../interfaces/partnerStatus.enum';


export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehicleRegistration?: string;

  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;
}