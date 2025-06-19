
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Types } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
import { DeliveryService } from '../delivery/delivery.service';
import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';
import { DELIVERY_PARTNER_CONSTANTS } from './deliveryPartnerConstants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class DeliveryPartnerService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,
    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async getProfile(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Retrieving partner profile', {
      service: 'DeliveryPartnerService',
      method: 'getProfile',
      partnerId: partnerId.toString()
    });
    
    try {
      const profile = await this.deliveryPartnerModel.findById(partnerId);
      if (!profile) {
        this.logger.warn('Partner profile not found', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND}: ${partnerId}`);
      }
      
      this.logger.info('Partner profile retrieved successfully', {
        partnerId: partnerId.toString()
      });
      return profile;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to retrieve partner profile', {
        error: err.message,
        stack: err.stack,
        partnerId: partnerId.toString()
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_PROFILE}: ${err.message}`);
    }
  }

  async create(registerPartnerDto: RegisterPartnerDto, partnerEmail: string): Promise<DeliveryPartnerDocument> {
    this.logger.info('Creating new delivery partner', {
      service: 'DeliveryPartnerService',
      method: 'create',
      email: partnerEmail
    });
    
    try {
      const registerData = {...registerPartnerDto, email: partnerEmail}
      const newPartner = await this.deliveryPartnerModel.create(registerData);
      this.logger.info('Delivery partner created successfully', {
        partnerId: newPartner._id,
        email: partnerEmail
      });
      return newPartner;
    } catch (err) {
      this.logger.error('Failed to create delivery partner', {
        error: err.message,
        stack: err.stack,
        email: partnerEmail
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_CREATE}: ${err.message}`);
    }
  }

  async verifyPartnerRegistration(email: string, mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Verifying partner registration', {
      service: 'DeliveryPartnerService',
      method: 'verifyPartnerRegistration',
      email,
      mobileNumber
    });
    
    try {
      const partner = await this.deliveryPartnerModel.findOne({
        $or: [
          { mobileNumber: mobileNumber },
          { email: email }
        ]
      });
      
      this.logger.info('Partner registration verification completed', {
        email,
        mobileNumber,
        exists: !!partner
      });
      return partner;
    } catch (err) {
      this.logger.error('Failed to verify partner registration', {
        error: err.message,
        stack: err.stack,
        email,
        mobileNumber
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_VERIFICATION}: ${err.message}`);
    }
  }

  async findAll(): Promise<DeliveryPartnerDocument[]> {
    this.logger.info('Retrieving all delivery partners', {
      service: 'DeliveryPartnerService',
      method: 'findAll'
    });
    
    try {
      const partners = await this.deliveryPartnerModel.find();
      this.logger.info('All delivery partners retrieved successfully', {
        count: partners.length
      });
      return partners;
    } catch (err) {
      this.logger.error('Failed to retrieve all delivery partners', {
        error: err.message,
        stack: err.stack
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_ALL_PARTNERS}: ${err.message}`);
    }
  }

  async findById(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Finding delivery partner by ID', {
      service: 'DeliveryPartnerService',
      method: 'findById',
      partnerId: partnerId.toString()
    });
    
    try {
      const partner = await this.deliveryPartnerModel.findById(partnerId);
      if (!partner) {
        this.logger.warn('Delivery partner not found', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.USER_NOT_FOUND);
      }
      
      this.logger.info('Delivery partner found successfully', {
        partnerId: partnerId.toString()
      });
      return partner;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to find delivery partner by ID', {
        error: err.message,
        stack: err.stack,
        partnerId: partnerId.toString()
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_FIND_BY_ID}: ${err.message}`);
    }
  }

  async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Finding delivery partner by email', {
      service: 'DeliveryPartnerService',
      method: 'findByEmail',
      email
    });
    
    try {
      const partner = await this.deliveryPartnerModel.findOne({ email });
      if (!partner) {
        this.logger.warn('Delivery partner not found', { email });
      }
      
      this.logger.info('Delivery partner found successfully', { email });
      return partner;
    } catch (err) {
      this.logger.error('Failed to find delivery partner by email', {
        error: err.message,
        stack: err.stack,
        email
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_FIND_BY_EMAIL}: ${err.message}`);
    }
  }

  async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Finding delivery partner by mobile number', {
      service: 'DeliveryPartnerService',
      method: 'findByMobileNumber',
      mobileNumber
    });
    
    try {
      const partner = await this.deliveryPartnerModel.findOne({ mobileNumber });
      if (!partner) {
        this.logger.warn('Delivery partner not found', { mobileNumber });
      }
      
      this.logger.info('Mobile number lookup completed', {
        mobileNumber,
        found: !!partner
      });
      return partner;
    } catch (err) {
      this.logger.error('Failed to find delivery partner by mobile number', {
        error: err.message,
        stack: err.stack,
        mobileNumber
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_FIND_BY_MOBILE}: ${err.message}`);
    }
  }

  async findStatus(partnerId: Types.ObjectId): Promise<string | null> {
    this.logger.info('Finding partner status', {
      service: 'DeliveryPartnerService',
      method: 'findStatus',
      partnerId: partnerId.toString()
    });
    
    try {
      const result = await this.deliveryPartnerModel.findById(partnerId, { status: 1, _id: 0 });
      if (!result) {
        this.logger.warn('Partner not found for status check', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }
      
      this.logger.info('Partner status retrieved successfully', {
        partnerId: partnerId.toString(),
        status: result.status
      });
      return result.status;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to find partner status', {
        error: err.message,
        stack: err.stack,
        partnerId: partnerId.toString()
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_STATUS}: ${err.message}`);
    }
  }

  async updateStatus(partnerId: Types.ObjectId, status: string): Promise<DeliveryPartnerDocument | null> {
    this.logger.info('Updating partner status', {
      service: 'DeliveryPartnerService',
      method: 'updateStatus',
      partnerId: partnerId.toString(),
      newStatus: status
    });
    
    try {
      const updatedPartner = await this.deliveryPartnerModel.findByIdAndUpdate(
        partnerId,
        { status },
        { new: true },
      );
      if (!updatedPartner) {
        this.logger.warn('Partner not found for status update', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND}: ${partnerId}`);
      }
      
      this.logger.info('Partner status updated successfully', {
        partnerId: partnerId.toString(),
        status: status
      });
      return updatedPartner;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to update partner status', {
        error: err.message,
        stack: err.stack,
        partnerId: partnerId.toString(),
        status: status
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_UPDATE_STATUS}: ${err.message}`);
    }
  }

  async remove(partnerId: Types.ObjectId): Promise<void> {
    this.logger.info('Removing delivery partner', {
      service: 'DeliveryPartnerService',
      method: 'remove',
      partnerId: partnerId.toString()
    });
    
    try {
      const result = await this.deliveryPartnerModel.findByIdAndDelete(partnerId);
      if (!result) {
        this.logger.warn('Partner not found for removal', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND}: ${partnerId}`);
      }
      
      this.logger.info('Delivery partner removed successfully', {
        partnerId: partnerId.toString()
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to remove delivery partner', {
        error: err.message,
        stack: err.stack,
        partnerId: partnerId.toString()
      });
      throw new MongooseError(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FAILED_REMOVE}: ${err.message}`);
    }
  }

  async getPartnerEarnings(partnerId: Types.ObjectId, period: string): Promise<number> {
    this.logger.info('Getting partner earnings', {
      service: 'DeliveryPartnerService',
      method: 'getPartnerEarnings',
      partnerId: partnerId.toString(),
      period
    });
    
    const earnings = await this.deliveryService.getEarningsByPeriod(partnerId, period);
    
    this.logger.info('Partner earnings calculated successfully', {
      partnerId: partnerId.toString(),
      period,
      earnings
    });
    return earnings;
  }

  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number) {
    this.logger.info('Getting partner deliveries', {
      service: 'DeliveryPartnerService',
      method: 'getPartnerDeliveries',
      partnerId: partnerId.toString(),
      page,
      limit
    });
    
    const deliveries = await this.deliveryService.getPartnerDeliveries(partnerId, page, limit);
    
    this.logger.info('Partner deliveries retrieved successfully', {
      partnerId: partnerId.toString(),
      page,
      limit,
      count: deliveries.data.length
    });
    return deliveries;
  }
}