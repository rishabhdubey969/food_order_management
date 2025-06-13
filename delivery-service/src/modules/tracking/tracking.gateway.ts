// import { ObjectId, Types } from 'mongoose';

// import { forwardRef, Inject, UseGuards } from '@nestjs/common';
// import { WebSocketGuard } from './guards/webSocketGuard';
// import { Server, Socket } from 'socket.io';
// import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { LocationUpdate } from './interfaces/locationUpdateInterface';
// import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
// import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
// import { RedisService } from '../redis/redisService';
// import { UpdatedSocket } from './interfaces/updatedSocketInterface';
// import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
// import { DeliveryService } from '../delivery/delivery.service';
// import { Role } from 'src/common/enums';
// import { MidModuleService } from '../mid-module/mid-module.service';




// @UseGuards(WebSocketGuard)
// @WebSocketGateway({
//   cors:{
//     origin: 'localhost:5173'
//   },
//   port: 4003
// })
// export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect{

//   @WebSocketServer() 
//   server: Server

//   private deliveryPartnersMap: Map<Types.ObjectId, Socket> = new Map();
//   private customersMap: Map<Types.ObjectId, Socket> = new Map();
//   private trackingMap: Map<Types.ObjectId, Socket> = new Map();

//   constructor(
//     private readonly redisService: RedisService,
//     @Inject(forwardRef(() => MidModuleService))
//     private readonly midModuleService: MidModuleService
//   ){}

//   handleConnection(client: UpdatedSocket){
//       const { role } = client.payload;

//       if(role === Role.DELIVERY_PARTNER){
//         const { partnerId } = client.payload;
//         this.deliveryPartnersMap.set(partnerId, client);
//       }

//       else if(role === Role.USER){
//         const { userId } = client.payload;
//         this.customersMap.set(userId, client);
//       }
//   }

//   handleDisconnect(client: UpdatedSocket) {
//       const { role } = client.payload;

//       if(role === Role.DELIVERY_PARTNER){
//         const { partnerId } = client.payload;
//         this.deliveryPartnersMap.delete(partnerId);
//       }

//       else if(role === Role.USER){
//         const { userId } = client.payload;
//         this.customersMap.delete(userId);
//       }
//   }

//   @SubscribeMessage('availableLocationUpdate')
//   async handleAvailableLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){

//     const { partnerId } = client.payload;
//     const status = await this.midModuleService.findStatus(partnerId);

//     if(status === DeliveryPartnerStatus.ONLINE){
//       await this.redisService.addAvailableDriver(partnerId, location.longitude, location.latitude);
//       console.log(`Updated available driver ${partnerId} location: [${location.longitude}, ${location.latitude}]`);
//     }

//   }

//   // Tracking Part
//   @SubscribeMessage('occupiedLocationUpdate')
//   async handleAssignedLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){
//     const { partnerId } = client.payload;
//     const userSocket = this.trackingMap.get(partnerId);
//     if(userSocket){
//       await this.server.to(userSocket.id).emit('trackingUpdate', location);
//     }
//   }

//   async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery){

//     deliveryPartnersList.forEach((partnerId) => {
//       if(partnerId != null){
//         const socket = this.deliveryPartnersMap.get(partnerId);
//         if (socket) {
//           this.server.to(socket.id).emit('newDelivery', currentDelivery);
//         }
//       }
//     });
//   }


//   @SubscribeMessage('deliveryResponseAccept')
//   async handleDeliveryResponse(@ConnectedSocket() client: UpdatedSocket, @MessageBody() data: {orderId: Types.ObjectId, userId: Types.ObjectId}){

//     const { partnerId } = client.payload;
//     const { orderId, userId } = data;

//     const assigned = await this.redisService.isKeyExists(`deliveryResponse:${orderId}`)

//     if(!assigned){

//       // Seting in Redis for conflict Resolution
//       await this.redisService.setData(`deliveryResponse:${orderId}`, 'ACCEPT', 5 * 60 * 1000);

//       // Sending Acceptance Request
//       this.server.to(client.id).emit('acknowledgement', {acknowledgement: true});

//       // Updating Delivery Partner Status
//       await this.midModuleService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);

//       // Updating Delivery Status 
//       await this.midModuleService.assignedPartner(partnerId, orderId);

//       // Updating the Mapping 
//       const userSocket = this.customersMap.get(userId);
//       if(userSocket){
//         this.trackingMap.set(partnerId, userSocket);
//       }

//     }else{
//       this.server.to(client.id).emit('acknowledgement', {acknowledgement: false})
//     }
//   }

// }

import { Types } from 'mongoose';

import {
  forwardRef,
  Inject,
  UseGuards,
  Logger, // Import Logger
  InternalServerErrorException, // Import suitable exceptions
  BadRequestException,
} from '@nestjs/common';
import { WebSocketGuard } from './guards/webSocketGuard';
import { Server, Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { LocationUpdate } from './interfaces/locationUpdateInterface';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { RedisService } from '../redis/redisService';
import { UpdatedSocket } from './interfaces/updatedSocketInterface';
import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
import { Role } from 'src/common/enums';
import { MidModuleService } from '../mid-module/mid-module.service';

@UseGuards(WebSocketGuard)
@WebSocketGateway({
  cors: {
    origin: 'localhost:5173', // Ensure this matches your frontend origin
  },
  port: 4003,
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name); // Instantiate logger

  
  private deliveryPartnersMap: Map<Types.ObjectId, Socket> = new Map();
  private customersMap: Map<Types.ObjectId, Socket> = new Map();
  private trackingMap: Map<Types.ObjectId, Socket> = new Map();

  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => MidModuleService))
    private readonly midModuleService: MidModuleService,
  ) {}

  // Handle new client connections
  async handleConnection(client: UpdatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    try {
      const { role } = client.payload;

      if (!role) {
        this.logger.warn(`Client ${client.id} connected without a role in payload. Disconnecting.`);
        client.disconnect(true); // Disconnect client immediately
        return;
      }

      if (role === Role.DELIVERY_PARTNER) {
        const { partnerId } = client.payload;
        if (!partnerId) {
          this.logger.warn(`Delivery partner client ${client.id} connected without partnerId. Disconnecting.`);
          client.disconnect(true);
          return;
        }
        this.deliveryPartnersMap.set(new Types.ObjectId(partnerId), client);
        this.logger.log(`Delivery Partner ${partnerId} connected and added to map.`);
      } else if (role === Role.USER) {
        const { userId } = client.payload;
        if (!userId) {
          this.logger.warn(`User client ${client.id} connected without userId. Disconnecting.`);
          client.disconnect(true);
          return;
        }
        this.customersMap.set(new Types.ObjectId(userId), client);
        this.logger.log(`User ${userId} connected and added to map.`);
      } else {
        this.logger.warn(`Client ${client.id} connected with unknown role: ${role}. Disconnecting.`);
        client.disconnect(true);
      }
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}: ${error.message}`, error.stack);
      client.disconnect(true); // Ensure client is disconnected on error
    }
  }

  // Handle client disconnections
  async handleDisconnect(client: UpdatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    try {
      const { role, partnerId, userId } = client.payload;

      if (role === Role.DELIVERY_PARTNER) {
        if (partnerId) {
          this.deliveryPartnersMap.delete(new Types.ObjectId(partnerId));
          this.logger.log(`Delivery Partner ${partnerId} disconnected and removed from map.`);
          await this.redisService.removeDriver(partnerId.toHexString());
        }
      } else if (role === Role.USER) {
        if (userId) {
          this.customersMap.delete(new Types.ObjectId(userId));
          this.logger.log(`User ${userId} disconnected and removed from map.`);
        }
      }
      // Also remove from trackingMap if this client was tracking someone
      // This part might need more complex logic depending on how tracking is initiated/ended
      this.trackingMap.forEach((socket, pId) => {
        if (socket.id === client.id) {
          this.trackingMap.delete(pId);
          this.logger.log(`Removed tracking for partner ${pId} as client ${client.id} disconnected.`);
        }
      });
    } catch (error) {
      this.logger.error(`Error handling disconnection for client ${client.id}: ${error.message}`, error.stack);
    }
  }

  // Handle location updates from available delivery partners
  @SubscribeMessage('availableLocationUpdate')
  async handleAvailableLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket) {
    this.logger.log(`Received 'availableLocationUpdate' from partner ${client.payload?.partnerId} (Socket ID: ${client.id})`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`'availableLocationUpdate' received from unauthenticated or invalid partner: ${client.id}`);
      return; // Do not process if partnerId is missing
    }
    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn(`Invalid location data received from ${client.payload.partnerId}: ${JSON.stringify(location)}`);
      client.emit('error', 'Invalid location data provided.');
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      const status = await this.midModuleService.findStatus(partnerId);

      if (status === DeliveryPartnerStatus.ONLINE) {
        await this.redisService.addAvailableDriver(partnerId.toHexString(), location.longitude, location.latitude);
        this.logger.debug(`Updated available driver ${partnerId} location: [${location.longitude}, ${location.latitude}]`);
      } else {
        this.logger.warn(`Partner ${partnerId} status is ${status}, not ONLINE. Location update not processed.`);
        // Optionally, inform the client that they are not online to send updates
        client.emit('statusMismatch', `Your status is ${status}, not ONLINE.`);
      }
    } catch (error) {
      this.logger.error(`Error handling 'availableLocationUpdate' for partner ${partnerId}: ${error.message}`, error.stack);
      client.emit('error', 'Failed to update location. Please try again.');
    }
  }

  // Handle location updates from occupied (assigned) delivery partners for tracking
  @SubscribeMessage('occupiedLocationUpdate')
  async handleAssignedLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket) {
    this.logger.log(`Received 'occupiedLocationUpdate' from partner ${client.payload?.partnerId} (Socket ID: ${client.id})`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`'occupiedLocationUpdate' received from unauthenticated or invalid partner: ${client.id}`);
      return;
    }
    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn(`Invalid location data received from ${client.payload.partnerId}: ${JSON.stringify(location)}`);
      client.emit('error', 'Invalid location data provided.');
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      // Find the customer socket that is tracking this partner
      const userSocket = this.trackingMap.get(partnerId);
      if (userSocket) {
        // Emit the tracking update to the specific customer socket
        this.server.to(userSocket.id).emit('trackingUpdate', location);
        this.logger.debug(`Tracking update sent to user ${userSocket.id} for partner ${partnerId}.`);
      } else {
        this.logger.warn(`No customer found tracking partner ${partnerId}. Location update not forwarded.`);
      }
    } catch (error) {
      this.logger.error(`Error handling 'occupiedLocationUpdate' for partner ${partnerId}: ${error.message}`, error.stack);
      client.emit('error', 'Failed to forward tracking update.');
    }
  }

  // Broadcast a new delivery request to a list of eligible delivery partners
  async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery) {
    this.logger.log(`Broadcasting new delivery request for order ${currentDelivery?.orderId} to ${deliveryPartnersList?.length} partners.`);
    if (!deliveryPartnersList) {
      this.logger.warn(`No delivery partners in the list to broadcast request for order ${currentDelivery?.orderId}.`);
      return;
    }

    
      deliveryPartnersList.forEach((partnerId) => {
        if (partnerId) { // Check if partnerId is not null
          const socket = this.deliveryPartnersMap.get(partnerId);
          if (socket) {
            this.server.to(socket.id).emit('newDelivery', currentDelivery);
            this.logger.debug(`New delivery request for order ${currentDelivery.orderId} sent to partner ${partnerId} (Socket ID: ${socket.id}).`);
          } else {
            this.logger.warn(`Partner ${partnerId} is in the list but their socket is not found in deliveryPartnersMap.`);
          }
        }
      });
      this.logger.log(`Finished broadcasting delivery request for order ${currentDelivery?.orderId}.`);
    
  }

  // Handle a delivery response (accept/reject) from a delivery partner
  @SubscribeMessage('deliveryResponseAccept')
  async handleDeliveryResponse(@ConnectedSocket() client: UpdatedSocket, @MessageBody() data: { orderId: Types.ObjectId; userId: Types.ObjectId }) {
    this.logger.log(`Received 'deliveryResponseAccept' from partner ${client.payload?.partnerId} for order ${data?.orderId}`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`'deliveryResponseAccept' received from unauthenticated or invalid partner: ${client.id}`);
      client.emit('acknowledgement', { acknowledgement: false, error: 'Unauthorized partner.' });
      return;
    }
    if (!data || !data.orderId || !data.userId) {
      this.logger.warn(`Invalid data received for 'deliveryResponseAccept' from ${client.payload.partnerId}: ${JSON.stringify(data)}`);
      client.emit('acknowledgement', { acknowledgement: false, error: 'Invalid order or user ID provided.' });
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);
    const { orderId, userId } = data;

    try {
      const assigned = await this.redisService.isKeyExists(`deliveryResponse:${orderId.toHexString()}`); // Use toHexString() for Redis keys

      if (!assigned) {
        this.logger.log(`Order ${orderId} is not yet assigned. Partner ${partnerId} is accepting.`);

        // Setting in Redis for conflict Resolution (to prevent multiple partners from accepting the same order)
        await this.redisService.setData(`deliveryResponse:${orderId.toHexString()}`, 'ACCEPT', 5 * 60 * 1000); // 5 minutes TTL
        this.logger.debug(`Set deliveryResponse:${orderId} in Redis to prevent conflicts.`);

        // Sending Acceptance Acknowledgment back to the partner
        client.emit('acknowledgement', { acknowledgement: true, message: 'Delivery accepted.' });
        this.logger.log(`Acknowledged acceptance to partner ${partnerId} for order ${orderId}.`);

        // Updating Delivery Partner Status to OCCUPIED
        await this.midModuleService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);
        this.logger.log(`Updated partner ${partnerId} status to OCCUPIED.`);

        // Updating Delivery Status (assigning partner to delivery)
        await this.midModuleService.assignedPartner(partnerId, orderId);
        this.logger.log(`Assigned partner ${partnerId} to order ${orderId}.`);

        // Updating the Tracking Map: Map this partner's ID to the customer's socket
        const userSocket = this.customersMap.get(userId);
        if (userSocket) {
          this.trackingMap.set(partnerId, userSocket);
          this.logger.log(`Added partner ${partnerId} to trackingMap with customer ${userId}'s socket.`);
          // Optionally, notify the customer that a driver has been assigned
          this.server.to(userSocket.id).emit('driverAssigned', { orderId: orderId, partnerId: partnerId });
        } else {
          this.logger.warn(`Customer ${userId} not found in customersMap. Tracking might not be active.`);
        }
      } else {
        this.logger.warn(`Order ${orderId} is already assigned. Partner ${partnerId}'s acceptance rejected.`);
        client.emit('acknowledgement', { acknowledgement: false, error: 'Order already assigned to another partner.' });
      }
    } catch (error) {
      this.logger.error(`Error handling 'deliveryResponseAccept' for partner ${partnerId}, order ${orderId}: ${error.message}`, error.stack);
      client.emit('acknowledgement', { acknowledgement: false, error: 'Failed to process delivery acceptance. Please try again.' });
    }
  }
}
