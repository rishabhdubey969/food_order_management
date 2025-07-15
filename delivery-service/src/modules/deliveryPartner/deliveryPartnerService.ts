
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
    /**
     * Retrieves the profile of a delivery partner by their ID.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The delivery partner's profile or null if not found.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Creates a new delivery partner with the provided registration data and email.
     *
     * Args:
     *   registerPartnerDto (RegisterPartnerDto): The data transfer object containing partner registration details.
     *   partnerEmail (string): The email address of the partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument>: The newly created delivery partner document.
     *
     * Throws:
     *   MongooseError: If a database error occurs during partner creation.
     */
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
    /**
     * Verifies if a partner with the given email or mobile number already exists.
     *
     * Args:
     *   email (string): The email address to check for existing registration.
     *   mobileNumber (string): The mobile number to check for existing registration.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The existing partner document if found, or null if not.
     *
     * Throws:
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Retrieves all delivery partners from the database.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument[]>: An array of all delivery partner documents.
     *
     * Throws:
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Retrieves a delivery partner by their ID.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The delivery partner document or null if not found.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Retrieves a delivery partner by their email address.
     *
     * Args:
     *   email (string): The email address of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The delivery partner document or null if not found.
     *
     * Throws:
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Retrieves a delivery partner by their mobile number.
     *
     * Args:
     *   mobileNumber (string): The mobile number of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The delivery partner document or null if not found.
     *
     * Throws:
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Retrieves the status of a delivery partner by their ID.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<string | null>: The status of the delivery partner or null if not found.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   MongooseError: If a database error occurs during the query.
     */
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
    /**
     * Updates the status of a delivery partner.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   status (string): The new status to set for the partner.
     *
     * Returns:
     *   Promise<DeliveryPartnerDocument | null>: The updated delivery partner document or null if not found.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   MongooseError: If a database error occurs during the update.
     */
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
    /**
     * Deletes a delivery partner by their ID.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<void>: No return value; completes the deletion process.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   MongooseError: If a database error occurs during the deletion.
     */
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

  async getPartnerEarnings(partnerId: Types.ObjectId, period: string) {
    /**
     * Retrieves the total earnings for a delivery partner over a specified period.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   period (string): The time period for earnings calculation (e.g., 'daily', 'weekly', 'monthly', 'yearly').
     *
     * Returns:
     *   Promise<number>: The total earnings for the specified period.
     */
    const earningsData = await this.deliveryService.getEarningsByPeriod(partnerId, period);
    return earningsData;
  }

  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number) {
    /**
     * Retrieves a paginated list of deliveries for a specific delivery partner.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   page (number): The page number for pagination.
     *   limit (number): The number of deliveries per page.
     *
     * Returns:
     *   Promise<any>: The paginated list of deliveries, including data and total count.
     */
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