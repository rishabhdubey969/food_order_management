

// import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, MongooseError, Types } from 'mongoose';
// import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
// import { DeliveryPartnerStatus } from './enums/partnerEnum';
// import { DeliveryService } from '../delivery/delivery.service';
// import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';




// @Injectable()
// export class DeliveryPartnerService {
//   constructor(
//     @InjectModel(DeliveryPartner.name)
//     private deliveryPartnerModel: Model<DeliveryPartnerDocument>,

//     @Inject(forwardRef(() => DeliveryService))
//     private deliveryService: DeliveryService
//   ) {}


//   async getProfile(partnerId: Types.ObjectId){
//     try{
//       return await this.deliveryPartnerModel.findById(partnerId).lean().exec();
//     }catch(err){
//       throw new MongooseError("Mongoose Error");
//     }
//   }
  
//   async create(registerPartnerDto: RegisterPartnerDto){
//     try{
//       await this.deliveryPartnerModel.create(registerPartnerDto);
//     }catch(err){
//       throw new MongooseError(err.Message);
//     }
//   }

//   async verifyPartnerRegistration(email: string, mobileNumber: string): Promise<DeliveryPartnerDocument | null>{
//     return await this.deliveryPartnerModel.findOne({
//       $or: [
//         { mobileNumber: mobileNumber },
//         { email: email }
//       ]
//     });
//   }

//   async findAll(): Promise<DeliveryPartnerDocument[]> {
//     return await this.deliveryPartnerModel.find().lean().exec();
//   }

//   async findById(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
//     return await this.deliveryPartnerModel.findById(partnerId).lean().exec();
//   }

//   async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
//     return await this.deliveryPartnerModel.findOne({ email }).lean().exec();
//   }

//   async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null>{
//     return await this.deliveryPartnerModel.findOne({mobileNumber: mobileNumber}).lean().exec();
//   }

//   async findStatus(partnerId: Types.ObjectId): Promise<DeliveryPartnerStatus | null> {
//   const result = await this.deliveryPartnerModel
//     .findById(partnerId, { status: 1, _id: 0 })
//     .lean()
//     .exec();

//   if (!result) {
//     throw new NotFoundException('Delivery partner not found');
//   }

//   return result.status;
// }

  
//   async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus): Promise<DeliveryPartnerDocument | null> {
//     return await this.deliveryPartnerModel.findByIdAndUpdate(
//       partnerId,
//       { status },
//       { new: true },
//     ).exec();
//   }

//   async remove(partnerId: Types.ObjectId){
//     await this.deliveryPartnerModel.findByIdAndDelete(partnerId);
//   }

//   async getPartnerEarnings(partnerId: Types.ObjectId, period: string): Promise<number>{
//     return await this.deliveryService.getEarningsByPeriod(partnerId, period);
//   }

//   async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number){
//     return await this.deliveryService.getPartnerDeliveries(partnerId, page, limit)
//   }

// }

import { forwardRef, Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Types } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { DeliveryService } from '../delivery/delivery.service';
import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';


@Injectable()
export class DeliveryPartnerService {
  private readonly logger = new Logger(DeliveryPartnerService.name);

  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,

    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService
  ) {}

  @ApiOperation({ summary: 'Get a delivery partner\'s profile by ID' })
  @ApiResponse({ status: 200, description: 'Delivery partner profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async getProfile(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to retrieve profile for partner ID: ${partnerId}`);
    try {
      const profile = await this.deliveryPartnerModel.findById(partnerId).lean().exec();
      if (!profile) {
        this.logger.warn(`Profile for partner ID: ${partnerId} not found.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully retrieved profile for partner ID: ${partnerId}`);
      return profile;
    } catch (err) {
      this.logger.error(`Error retrieving profile for partner ID: ${partnerId}`, err.stack);
      // Re-throw if it's already a specific HTTP exception, otherwise wrap in MongooseError
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new MongooseError(`Failed to retrieve profile: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Create a new delivery partner' })
  @ApiResponse({ status: 201, description: 'Delivery partner created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid partner data' })
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

  @ApiOperation({ summary: 'Verify if a partner is registered by email or mobile number' })
  @ApiResponse({ status: 200, description: 'Returns partner data if registered, null otherwise' })
  async verifyPartnerRegistration(email: string, mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Verifying partner registration for email: ${email} or mobile: ${mobileNumber}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({
        $or: [
          { mobileNumber: mobileNumber },
          { email: email }
        ]
      }).lean().exec();
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

  @ApiOperation({ summary: 'Find all delivery partners' })
  @ApiResponse({ status: 200, description: 'List of all delivery partners' })
  async findAll(): Promise<DeliveryPartnerDocument[]> {
    this.logger.log('Attempting to find all delivery partners.');
    try {
      const partners = await this.deliveryPartnerModel.find().lean().exec();
      this.logger.log(`Successfully found ${partners.length} delivery partners.`);
      return partners;
    } catch (err) {
      this.logger.error('Error finding all delivery partners.', err.stack);
      throw new MongooseError(`Failed to retrieve all delivery partners: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Find a delivery partner by ID' })
  @ApiResponse({ status: 200, description: 'Delivery partner found' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async findById(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by ID: ${partnerId}`);
    try {
      const partner = await this.deliveryPartnerModel.findById(partnerId).lean().exec();
      if (!partner) {
        this.logger.warn(`Delivery partner with ID: ${partnerId} not found.`);
        // Consider throwing NotFoundException here if this is a public API endpoint
      } else {
        this.logger.log(`Successfully found delivery partner by ID: ${partnerId}`);
      }
      return partner;
    } catch (err) {
      this.logger.error(`Error finding delivery partner by ID: ${partnerId}`, err.stack);
      throw new MongooseError(`Failed to find delivery partner by ID: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Find a delivery partner by email' })
  @ApiResponse({ status: 200, description: 'Delivery partner found by email' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by email: ${email}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({ email }).lean().exec();
      if (!partner) {
        this.logger.warn(`Delivery partner with email: ${email} not found.`);
      } else {
        this.logger.log(`Successfully found delivery partner by email: ${email}`);
      }
      return partner;
    } catch (err) {
      this.logger.error(`Error finding delivery partner by email: ${email}`, err.stack);
      throw new MongooseError(`Failed to find delivery partner by email: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Find a delivery partner by mobile number' })
  @ApiResponse({ status: 200, description: 'Delivery partner found by mobile number' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to find delivery partner by mobile number: ${mobileNumber}`);
    try {
      const partner = await this.deliveryPartnerModel.findOne({ mobileNumber: mobileNumber }).lean().exec();
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

  @ApiOperation({ summary: 'Get the status of a delivery partner' })
  @ApiResponse({ status: 200, description: 'Delivery partner status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async findStatus(partnerId: Types.ObjectId): Promise<DeliveryPartnerStatus | null> {
    this.logger.log(`Attempting to find status for partner ID: ${partnerId}`);
    try {
      const result = await this.deliveryPartnerModel
        .findById(partnerId, { status: 1, _id: 0 })
        .lean()
        .exec();

      if (!result) {
        this.logger.warn(`Status for partner ID: ${partnerId} not found, partner does not exist.`);
        throw new NotFoundException('Delivery partner not found');
      }
      this.logger.log(`Successfully retrieved status for partner ID: ${partnerId}`);
      return result.status;
    } catch (err) {
      this.logger.error(`Error finding status for partner ID: ${partnerId}`, err.stack);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new MongooseError(`Failed to find partner status: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Update a delivery partner\'s status' })
  @ApiResponse({ status: 200, description: 'Delivery partner status updated successfully' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  @ApiResponse({ status: 400, description: 'Invalid status provided' })
  async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus): Promise<DeliveryPartnerDocument | null> {
    this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
    try {
      const updatedPartner = await this.deliveryPartnerModel.findByIdAndUpdate(
        partnerId,
        { status },
        { new: true },
      ).exec();

      if (!updatedPartner) {
        this.logger.warn(`Partner with ID: ${partnerId} not found for status update.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
      return updatedPartner;
    } catch (err) {
      this.logger.error(`Error updating status for partner ID: ${partnerId} to ${status}`, err.stack);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new MongooseError(`Failed to update partner status: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Remove a delivery partner by ID' })
  @ApiResponse({ status: 200, description: 'Delivery partner removed successfully' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  async remove(partnerId: Types.ObjectId): Promise<void> {
    this.logger.log(`Attempting to remove delivery partner with ID: ${partnerId}`);
    try {
      const result = await this.deliveryPartnerModel.findByIdAndDelete(partnerId).exec();
      if (!result) {
        this.logger.warn(`Partner with ID: ${partnerId} not found for removal.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found.`);
      }
      this.logger.log(`Successfully removed delivery partner with ID: ${partnerId}`);
    } catch (err) {
      this.logger.error(`Error removing delivery partner with ID: ${partnerId}`, err.stack);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new MongooseError(`Failed to remove delivery partner: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Get earnings for a partner by period' })
  @ApiResponse({ status: 200, description: 'Earnings calculated successfully', type: Number })
  @ApiResponse({ status: 400, description: 'Invalid period specified' })
  async getPartnerEarnings(partnerId: Types.ObjectId, period: string): Promise<number> {
    this.logger.log(`Attempting to get earnings for partner ID: ${partnerId} for period: ${period}`);
    try {
      const earnings = await this.deliveryService.getEarningsByPeriod(partnerId, period);
      this.logger.log(`Successfully retrieved earnings for partner ID: ${partnerId} for period: ${period}`);
      return earnings;
    } catch (err) {
      this.logger.error(`Error getting earnings for partner ID: ${partnerId} for period: ${period}`, err.stack);
      throw new MongooseError(`Failed to get partner earnings: ${err.message}`);
    }
  }

  @ApiOperation({ summary: 'Get paginated deliveries for a partner' })
  @ApiResponse({ status: 200, description: 'Paginated deliveries returned' })
  @ApiResponse({ status: 400, description: 'Error fetching deliveries' })
  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number) {
    this.logger.log(`Attempting to get paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
    try {
      const deliveries = await this.deliveryService.getPartnerDeliveries(partnerId, page, limit);
      this.logger.log(`Successfully retrieved paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
      return deliveries;
    } catch (err) {
      this.logger.error(`Error getting paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`, err.stack);
      throw new MongooseError(`Failed to get partner deliveries: ${err.message}`);
    }
  }
}