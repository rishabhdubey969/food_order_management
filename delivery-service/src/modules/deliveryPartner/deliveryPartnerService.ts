

import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Types } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { DeliveryService } from '../delivery/delivery.service';
import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';




@Injectable()
export class DeliveryPartnerService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,

    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService
  ) {}


  async getProfile(partnerId: Types.ObjectId){
    try{
      return await this.deliveryPartnerModel.findById(partnerId).lean().exec();
    }catch(err){
      throw new MongooseError("Mongoose Error");
    }
  }
  
  async create(registerPartnerDto: RegisterPartnerDto){
    try{
      await this.deliveryPartnerModel.create(registerPartnerDto);
    }catch(err){
      throw new MongooseError(err.Message);
    }
  }

  async verifyPartnerRegistration(email: string, mobileNumber: string): Promise<DeliveryPartnerDocument | null>{
    return await this.deliveryPartnerModel.findOne({
      $or: [
        { mobileNumber: mobileNumber },
        { email: email }
      ]
    });
  }

  async findAll(): Promise<DeliveryPartnerDocument[]> {
    return await this.deliveryPartnerModel.find().lean().exec();
  }

  async findById(partnerId: Types.ObjectId): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findById(partnerId).lean().exec();
  }

  async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findOne({ email }).lean().exec();
  }

  async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null>{
    return await this.deliveryPartnerModel.findOne({mobileNumber: mobileNumber}).lean().exec();
  }

  async findStatus(partnerId: Types.ObjectId): Promise<DeliveryPartnerStatus | null> {
  const result = await this.deliveryPartnerModel
    .findById(partnerId, { status: 1, _id: 0 })
    .lean()
    .exec();

  if (!result) {
    throw new NotFoundException('Delivery partner not found');
  }

  return result.status;
}

  
  async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findByIdAndUpdate(
      partnerId,
      { status },
      { new: true },
    ).exec();
  }

  async remove(partnerId: Types.ObjectId){
    await this.deliveryPartnerModel.findByIdAndDelete(partnerId);
  }

  async getPartnerEarnings(partnerId: Types.ObjectId, period: string): Promise<number>{
    return await this.deliveryService.getEarningsByPeriod(partnerId, period);
  }

  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number, limit: number){
    return await this.deliveryService.getPartnerDeliveries(partnerId, page, limit)
  }

}