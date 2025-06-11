import { ObjectId, Types } from 'mongoose';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';

@Injectable()
export class MidModuleService {

    constructor(
        @Inject(forwardRef(() => DeliveryService))
        private readonly deliveryService: DeliveryService,

        @Inject(forwardRef(() => DeliveryPartnerService))
        private readonly deliveryPartnerService: DeliveryPartnerService
    ){}


    async findStatus(partnerId: Types.ObjectId){
        return await this.deliveryPartnerService.findStatus(partnerId);
    }

    async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus){
        await this.deliveryPartnerService.updateStatus(partnerId, status);
    }

    async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId){
        await this.deliveryService.assignedPartner(partnerId, orderId);
    }
}
