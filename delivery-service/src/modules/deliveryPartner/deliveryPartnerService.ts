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


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryPartner, DeliveryPartnerDocument } from './modles/deliveryPartnerModel';
import { CreateDeliveryPartnerDto } from './dtos/createPartnerDto';
import { DeliveryPartnerStatus } from './enums/partnerEnumA';


@Injectable()
export class DeliveryPartnerService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private deliveryPartnerModel: Model<DeliveryPartnerDocument>,
  ) {}

  async create(createDeliveryPartnerDto: CreateDeliveryPartnerDto): Promise<DeliveryPartner> {
    const createdPartner = new this.deliveryPartnerModel(createDeliveryPartnerDto);
    return await createdPartner.save();
  }

  async findAll(): Promise<DeliveryPartner[]> {
    return await this.deliveryPartnerModel.find().exec();
  }

  async findById(id: string): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerModel.findOne({ email }).exec();
  }

  async updateStatus(id: string, status: string): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerModel.findByIdAndUpdate(
      id,
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

}