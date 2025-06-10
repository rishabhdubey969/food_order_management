import { Message } from './../../../node_modules/@nestjs/microservices/external/kafka.interface.d';
import { RegisterPartnerDto } from '../auth/dtos/registerPartnerDto';
// import { Inject, Injectable, NotFoundException } from '@nestjs/common';
// import { CreatePartnerDto } from './dtos/createPartnerDto';
// import { PartnerStatus } from './interfaces/partnerEnumA';
// import { UpdatePartnerDto } from './dtos/updatePartnerDto';
// import { Model } from 'mongoose';
// import { DeliveryPartner, DeliveryPartnerDocument } from './modles/deliveryPartnerModel';

// @Injectable()
// export class DeliveryPartnerService {
//   constructor(
//     @Inject(DeliveryPartner.name)
//     private readonly deliveryPartnerModel: Model<DeliveryPartnerDocument>
//   ) {}

//   async create(createPartnerDto: CreatePartnerDto): Promise<DeliveryPartner> {
//     const partner = new this.deliveryPartnerModel(createPartnerDto);
//     return await partner.save();
//   }

//   async findAll(): Promise<DeliveryPartner[]> {
//     return await this.deliveryPartnerModel.find().exec();
//   }

//   async findAvailablePartners(): Promise<DeliveryPartner[]> {
//     return await this.deliveryPartnerModel.find({ 
//       status: PartnerStatus.ONLINE,
//       isAvailable: true 
//     }).exec();
//   }

//   async findOne(partnerId: string): Promise<DeliveryPartner> {
//     const partner = await this.deliveryPartnerModel.findById(partnerId).exec();
//     if (!partner) {
//       throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//     }
//     return partner;
//   }

//   async findByPartnerId(partnerId: string): Promise<DeliveryPartner> {
//     const partner = await this.deliveryPartnerModel.findOne({ partnerId }).exec();
//     if (!partner) {
//       throw new NotFoundException(`Delivery partner with partnerId ${partnerId} not found`);
//     }
//     return partner;
//   }

//   async update(partnerId: string, updatePartnerDto: UpdatePartnerDto): Promise<DeliveryPartner> {
//     const updatedPartner = await this.deliveryPartnerModel
//       .findByIdAndUpdate(partnerId, updatePartnerDto, { new: true })
//       .exec();
    
//     if (!updatedPartner) {
//       throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//     }
//     return updatedPartner;
//   }

//   async updateStatus(partnerId: string, status: PartnerStatus): Promise<DeliveryPartner> {
//     const updatedPartner = await this.deliveryPartnerModel
//       .findByIdAndUpdate(
//         partnerId,
//         { status },
//         { new: true }
//       )
//       .exec();

//     if (!updatedPartner) {
//       throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//     }
//     return updatedPartner;
//   }

//   async remove(partnerId: string): Promise<DeliveryPartner> {
//     const deletedPartner = await this.deliveryPartnerModel
//       .findByIdAndDelete(partnerId)
//       .exec();
    
//     if (!deletedPartner) {
//       throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//     }
//     return deletedPartner;
//   }

//   async countAvailablePartners(): Promise<number> {
//     return this.deliveryPartnerModel.countDocuments({
//       status: PartnerStatus.ONLINE,
//       isAvailable: true
//     }).exec();
//   }

//   async findNearbyPartners(location: { latitude: number, longitude: number }, maxDistance: number): Promise<DeliveryPartner[]> {
//     return this.deliveryPartnerModel.find({
//       currentLocation: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [location.longitude, location.latitude]
//           },
//           $maxDistance: maxDistance
//         }
//       },
//       isAvailable: true
//     }).exec();
//   }
// }


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { DeliveryService } from '../delivery/delivery.service';




@Injectable()
export class DeliveryPartnerService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,
    private deliveryService: DeliveryService
  ) {}


  async getProfile(partnerId: string){
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

  async findById(id: string): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findById(id).lean().exec();
  }

  async findByEmail(email: string): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findOne({ email }).lean().exec();
  }

  async findByMobileNumber(mobileNumber: string): Promise<DeliveryPartnerDocument | null>{
    return await this.deliveryPartnerModel.findOne({mobileNumber: mobileNumber}).lean().exec();
  }

  async findStatus(partnerId: string): Promise<DeliveryPartnerStatus | null> {
  const result = await this.deliveryPartnerModel
    .findById(partnerId, { status: 1, _id: 0 })
    .lean()
    .exec();

  if (!result) {
    throw new NotFoundException('Delivery partner not found');
  }

  return result.status;
}

  
  async updateStatus(partnerId: string, status: DeliveryPartnerStatus): Promise<DeliveryPartnerDocument | null> {
    return await this.deliveryPartnerModel.findByIdAndUpdate(
      partnerId,
      { status },
      { new: true },
    ).exec();
  }


  async updateLocation(
    partnerId: string,
    latitude: number,
    longitude: number,
  ): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerModel.findByIdAndUpdate(
      partnerId,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
      },
      { new: true },
    ).exec();
  }

 
async findNearby(
    latitude: number,
    longitude: number,
    maxDistance: number,
  ): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerModel.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude], 
          },
          $maxDistance: maxDistance,
        },
      },
      status: DeliveryPartnerStatus.ONLINE,
    }).exec();
  }

  async remove(partnerId: string){
    await this.deliveryPartnerModel.findByIdAndDelete(partnerId);
  }

  async getPartnerEarnings(partnerId: string, period: string): Promise<number>{
    return await this.deliveryService.getEarningsByPeriod(partnerId, period);
  }

  async getPartnerDeliveries(partnerId: string, page: number, limit: number){
    return await this.deliveryService.getPartnerDeliveries(partnerId, page, limit)
  }

}