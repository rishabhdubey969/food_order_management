

import { Types } from 'mongoose';
import { forwardRef, Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
 

@Injectable()
export class MidModuleService {
    private readonly logger = new Logger(MidModuleService.name);

    constructor(
        @Inject(forwardRef(() => DeliveryService))
        private readonly deliveryService: DeliveryService,

        @Inject(forwardRef(() => DeliveryPartnerService))
        private readonly deliveryPartnerService: DeliveryPartnerService
    ) {}

    async findStatus(partnerId: Types.ObjectId) {
        this.logger.log(`Attempting to find status for partner ID: ${partnerId}`);
       
        const status = await this.deliveryPartnerService.findStatus(partnerId);
        this.logger.log(`Successfully retrieved status for partner ID: ${partnerId}: ${status}`);
        return status;
    }

    async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus) {
        this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
        
        await this.deliveryPartnerService.updateStatus(partnerId, status);
        this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
    }

    async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId) {
        this.logger.log(`Attempting to assign partner ${partnerId} to order ${orderId}`);
       
        await this.deliveryService.assignedPartner(partnerId, orderId);
        this.logger.log(`Successfully assigned partner ${partnerId} to order ${orderId}`);
    }
}