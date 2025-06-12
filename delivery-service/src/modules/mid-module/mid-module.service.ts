// import { Types } from 'mongoose';
// import { forwardRef, Inject, Injectable } from '@nestjs/common';
// import { DeliveryService } from '../delivery/delivery.service';
// import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
// import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';

// @Injectable()
// export class MidModuleService {

//     constructor(
//         @Inject(forwardRef(() => DeliveryService))
//         private readonly deliveryService: DeliveryService,

//         @Inject(forwardRef(() => DeliveryPartnerService))
//         private readonly deliveryPartnerService: DeliveryPartnerService
//     ){}


//     async findStatus(partnerId: Types.ObjectId){
//         return await this.deliveryPartnerService.findStatus(partnerId);
//     }

//     async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus){
//         await this.deliveryPartnerService.updateStatus(partnerId, status);
//     }

//     async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId){
//         await this.deliveryService.assignedPartner(partnerId, orderId);
//     }
// }


import { Types } from 'mongoose';
import { forwardRef, Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { MongooseError } from 'mongoose'; 

@Injectable()
export class MidModuleService {
    private readonly logger = new Logger(MidModuleService.name); // Instantiate logger

    constructor(
        @Inject(forwardRef(() => DeliveryService))
        private readonly deliveryService: DeliveryService,

        @Inject(forwardRef(() => DeliveryPartnerService))
        private readonly deliveryPartnerService: DeliveryPartnerService
    ) {}

    async findStatus(partnerId: Types.ObjectId) {
        this.logger.log(`Attempting to find status for partner ID: ${partnerId}`);
        try {
            const status = await this.deliveryPartnerService.findStatus(partnerId);
            this.logger.log(`Successfully retrieved status for partner ID: ${partnerId}: ${status}`);
            return status;
        } catch (error) {
            this.logger.error(`Error finding status for partner ID: ${partnerId}: ${error.message}`, error.stack);
            if (error instanceof MongooseError) {
                throw error; // Re-throw MongooseError if that's what's expected
            }
            throw new InternalServerErrorException(`Failed to retrieve partner status: ${error.message}`);
        }
    }

    async updateStatus(partnerId: Types.ObjectId, status: DeliveryPartnerStatus) {
        this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
        try {
            await this.deliveryPartnerService.updateStatus(partnerId, status);
            this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
        } catch (error) {
            this.logger.error(`Error updating status for partner ID: ${partnerId} to ${status}: ${error.message}`, error.stack);
            if (error instanceof MongooseError) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to update partner status: ${error.message}`);
        }
    }

    async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId) {
        this.logger.log(`Attempting to assign partner ${partnerId} to order ${orderId}`);
        try {
            await this.deliveryService.assignedPartner(partnerId, orderId);
            this.logger.log(`Successfully assigned partner ${partnerId} to order ${orderId}`);
        } catch (error) {
            this.logger.error(`Error assigning partner ${partnerId} to order ${orderId}: ${error.message}`, error.stack);
            if (error instanceof MongooseError) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to assign partner to order: ${error.message}`);
        }
    }
}