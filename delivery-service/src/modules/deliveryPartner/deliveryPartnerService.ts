
import { forwardRef, Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Types } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { DeliveryService } from '../delivery/delivery.service';
import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';



@Injectable()
export class DeliveryPartnerService {
  private readonly logger = new Logger(DeliveryPartnerService.name);

  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,

    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService
  ) {}


  async getProfile(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to retrieve profile for partner ID: ${partnerId}`);
    try {
      const profile = await this.deliveryPartnerModel.findById(partnerId);
      if (!profile) {
        this.logger.warn(`Profile for partner ID: ${partnerId} not found.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully retrieved profile for partner ID: ${partnerId}`);
      return profile;
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error retrieving profile for partner ID: ${partnerId}`, err.stack);
      throw new MongooseError(`Failed to retrieve profile: ${err.message}`);
    }
  }


  async create(registerPartnerDto: RegisterPartnerDto): Promise<DeliveryPartnerDocument> {
    this.logger.log(`Attempting to create a new delivery partner with email: ${registerPartnerDto.email}`);
    try {
      const newPartner = await this.deliveryPartnerModel.create(registerPartnerDto);
      this.logger.log(`Successfully created delivery partner with ID: ${newPartner._id}`);
      return newPartner;
    } catch (err) {
      this.logger.error(`Error creating delivery partner with email: ${registerPartnerDto.email}`, err.stack);
      throw new MongooseError(`Failed to create delivery partner: ${err.message}`);
    }
  }

  async verifyPartnerRegistration(email: string, mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Verifying partner registration for email: ${email} or mobile: ${mobileNumber}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({
        $or: [
          { mobileNumber: mobileNumber },
          { email: email }
        ]
      });
      if (partner) {
        this.logger.log(`Partner found during verification for email: ${email} or mobile: ${mobileNumber}`);
      } else {
        this.logger.log(`No partner found during verification for email: ${email} or mobile: ${mobileNumber}`);
      }
      return partner;
    } catch (err) {
      this.logger.error(`Error verifying partner registration for email: ${email} or mobile: ${mobileNumber}`, err.stack);
      throw new MongooseError(`Failed to verify partner registration: ${err.message}`);
    }
  }

  async findAll(): Promise<DeliveryPartnerDocument[]> {
    this.logger.log('Attempting to find all delivery partners.');
    try {
      const partners = await this.deliveryPartnerModel.find();
      this.logger.log(`Successfully found ${partners.length} delivery partners.`);
      return partners;
    } catch (err) {
      this.logger.error('Error finding all delivery partners.', err.stack);
      throw new MongooseError(`Failed to retrieve all delivery partners: ${err.message}`);
    }
  }

  async findById(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by ID: ${partnerId}`);
    try {
      const partner = await this.deliveryPartnerModel.findById(partnerId);
      if (!partner) {
        this.logger.warn(`Delivery partner with ID: ${partnerId} not found.`);
        throw new NotFoundException('User Not Found')
      } else {
        this.logger.log(`Successfully found delivery partner by ID: ${partnerId}`);
      }
      return partner;
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error finding delivery partner by ID: ${partnerId}`, err.stack);
      throw new MongooseError(`Failed to find delivery partner by ID: ${err.message}`);
    }
  }

  async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by email: ${email}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({ email });
      if (!partner) {
        this.logger.warn(`Delivery partner with email: ${email} not found.`);
        throw new NotFoundException('Delivery Partner Not found!!!')
      } else {
        this.logger.log(`Successfully found delivery partner by email: ${email}`);
      }
      return partner;
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error finding delivery partner by email: ${email}`, err.stack);
      throw new MongooseError(`Failed to find delivery partner by email: ${err.message}`);
    }
  }

  async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by mobile number: ${mobileNumber}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({ mobileNumber: mobileNumber });
      if (!partner) {
        this.logger.warn(`Delivery partner with mobile number: ${mobileNumber} not found.`);
      } else {
        this.logger.log(`Successfully found delivery partner by mobile number: ${mobileNumber}`);
      }
      return partner;
    } catch (err) {
      this.logger.error(`Error finding delivery partner by mobile number: ${mobileNumber}`, err.stack);
      throw new MongooseError(`Failed to find delivery partner by mobile number: ${err.message}`);
    }
  }

  async findStatus(partnerId: Types.ObjectId): Promise<DeliveryPartnerStatus | null> {
    this.logger.log(`Attempting to find status for partner ID: ${partnerId}`);
    try {
      const result = await this.deliveryPartnerModel.findById(partnerId, { status: 1, _id: 0 });

      if (!result) {
        this.logger.warn(`Status for partner ID: ${partnerId} not found, partner does not exist.`);
        throw new NotFoundException('Delivery partner not found');
      }
      this.logger.log(`Successfully retrieved status for partner ID: ${partnerId}`);
      return result.status;
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error finding status for partner ID: ${partnerId}`, err.stack);
      throw new MongooseError(`Failed to find partner status: ${err.message}`);
    }
  }

  async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
    try {
      const updatedPartner = await this.deliveryPartnerModel.findByIdAndUpdate(
        partnerId,
        { status },
        { new: true },
      );

      if (!updatedPartner) {
        this.logger.warn(`Partner with ID: ${partnerId} not found for status update.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
      return updatedPartner;
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error updating status for partner ID: ${partnerId} to ${status}`, err.stack);
      throw new MongooseError(`Failed to update partner status: ${err.message}`);
    }
  }

  async remove(partnerId: Types.ObjectId): Promise<void> {
    this.logger.log(`Attempting to remove delivery partner with ID: ${partnerId}`);
    try {
      const result = await this.deliveryPartnerModel.findByIdAndDelete(partnerId);
      if (!result) {
        this.logger.warn(`Partner with ID: ${partnerId} not found for removal.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully removed delivery partner with ID: ${partnerId}`);
    } catch (err) {
      if(err instanceof NotFoundException){
        throw err;
      }
      this.logger.error(`Error removing delivery partner with ID: ${partnerId}`, err.stack);
      throw new MongooseError(`Failed to remove delivery partner: ${err.message}`);
    }
  }

  async getPartnerEarnings(partnerId: Types.ObjectId, period: string): Promise<number> {
    this.logger.log(`Attempting to get earnings for partner ID: ${partnerId} for period: ${period}`);
    
      const earnings = await this.deliveryService.getEarningsByPeriod(partnerId, period);
      this.logger.log(`Successfully retrieved earnings for partner ID: ${partnerId} for period: ${period}`);
      return earnings;
    
  }


  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number) {
    this.logger.log(`Attempting to get paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
  
      const deliveries = await this.deliveryService.getPartnerDeliveries(partnerId, page, limit);
      this.logger.log(`Successfully retrieved paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
      return deliveries;
    
  }
}