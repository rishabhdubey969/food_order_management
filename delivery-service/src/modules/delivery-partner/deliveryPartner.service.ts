import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartnerDto } from './dtos/createPartner.dto';
import { PartnerStatus } from './interfaces/partnerStatus.enum';
import { UpdatePartnerDto } from './dtos/updatePartner.dto';
import { Model } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './modles/deliveryPartner.model';

@Injectable()
export class DeliveryPartnerService {
  constructor(
    @Inject(DeliveryPartner.name)
    private readonly deliveryPartnerModel: Model<DeliveryPartnerDocument>
  ) {}

  async create(createPartnerDto: CreatePartnerDto): Promise<DeliveryPartner> {
    const partner = new this.deliveryPartnerModel(createPartnerDto);
    return await partner.save();
  }

  async findAll(): Promise<DeliveryPartner[]> {
    return await this.deliveryPartnerModel.find().exec();
  }

  async findAvailablePartners(): Promise<DeliveryPartner[]> {
    return await this.deliveryPartnerModel.find({ 
      status: PartnerStatus.AVAILABLE,
      isAvailable: true 
    }).exec();
  }

  async findOne(id: string): Promise<DeliveryPartner> {
    const partner = await this.deliveryPartnerModel.findById(id).exec();
    if (!partner) {
      throw new NotFoundException(`Delivery partner with ID ${id} not found`);
    }
    return partner;
  }

  async findByPartnerId(partnerId: string): Promise<DeliveryPartner> {
    const partner = await this.deliveryPartnerModel.findOne({ partnerId }).exec();
    if (!partner) {
      throw new NotFoundException(`Delivery partner with partnerId ${partnerId} not found`);
    }
    return partner;
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto): Promise<DeliveryPartner> {
    const updatedPartner = await this.deliveryPartnerModel
      .findByIdAndUpdate(id, updatePartnerDto, { new: true })
      .exec();
    
    if (!updatedPartner) {
      throw new NotFoundException(`Delivery partner with ID ${id} not found`);
    }
    return updatedPartner;
  }

  async updateStatus(id: string, status: PartnerStatus): Promise<DeliveryPartner> {
    const updatedPartner = await this.deliveryPartnerModel
      .findByIdAndUpdate(
        id,
        { status },
        { new: true }
      )
      .exec();

    if (!updatedPartner) {
      throw new NotFoundException(`Delivery partner with ID ${id} not found`);
    }
    return updatedPartner;
  }

  async remove(id: string): Promise<DeliveryPartner> {
    const deletedPartner = await this.deliveryPartnerModel
      .findByIdAndDelete(id)
      .exec();
    
    if (!deletedPartner) {
      throw new NotFoundException(`Delivery partner with ID ${id} not found`);
    }
    return deletedPartner;
  }

  // Additional useful methods
  async countAvailablePartners(): Promise<number> {
    return this.deliveryPartnerModel.countDocuments({
      status: PartnerStatus.AVAILABLE,
      isAvailable: true
    }).exec();
  }

  async findNearbyPartners(location: { latitude: number, longitude: number }, maxDistance: number): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerModel.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: maxDistance
        }
      },
      isAvailable: true
    }).exec();
  }
}