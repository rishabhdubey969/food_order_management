import { ObjectId, Types } from 'mongoose';

import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { WebSocketGuard } from './guards/webSocketGuard';
import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { LocationUpdate } from './interfaces/locationUpdateInterface';
import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { RedisService } from '../redis/redisService';
import { UpdatedSocket } from './interfaces/updatedSocketInterface';
import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
import { DeliveryService } from '../delivery/delivery.service';
import { Role } from 'src/common/enums';
import { MidModuleService } from '../mid-module/mid-module.service';




@UseGuards(WebSocketGuard)
@WebSocketGateway({
  cors:{
    origin: 'localhost:5173'
  },
  port: 4003
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() 
  server: Server

  private deliveryPartnersMap: Map<Types.ObjectId, Socket> = new Map();
  private customersMap: Map<Types.ObjectId, Socket> = new Map();
  private trackingMap: Map<Types.ObjectId, Socket> = new Map();

  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => MidModuleService))
    private readonly midModuleService: MidModuleService
  ){}

  handleConnection(client: UpdatedSocket){
      const { role } = client.payload;

      if(role === Role.DELIVERY_PARTNER){
        const { partnerId } = client.payload;
        this.deliveryPartnersMap.set(partnerId, client);
      }

      else if(role === Role.USER){
        const { userId } = client.payload;
        this.customersMap.set(userId, client);
      }
  }

  handleDisconnect(client: UpdatedSocket) {
      const { role } = client.payload;

      if(role === Role.DELIVERY_PARTNER){
        const { partnerId } = client.payload;
        this.deliveryPartnersMap.delete(partnerId);
      }

      else if(role === Role.USER){
        const { userId } = client.payload;
        this.customersMap.delete(userId);
      }
  }

  @SubscribeMessage('availableLocationUpdate')
  async handleAvailableLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){

    const { partnerId } = client.payload;
    const status = await this.midModuleService.findStatus(partnerId);

    if(status === DeliveryPartnerStatus.ONLINE){
      await this.redisService.addAvailableDriver(partnerId, location.longitude, location.latitude);
      console.log(`Updated available driver ${partnerId} location: [${location.longitude}, ${location.latitude}]`);
    }

  }

  // Tracking Part
  @SubscribeMessage('occupiedLocationUpdate')
  async handleAssignedLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){
    const { partnerId } = client.payload;
    const userSocket = this.trackingMap.get(partnerId);
    if(userSocket){
      await this.server.to(userSocket.id).emit('trackingUpdate', location);
    }
  }

  async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery){

    deliveryPartnersList.forEach((partnerId) => {
      if(partnerId != null){
        const socket = this.deliveryPartnersMap.get(partnerId);
        if (socket) {
          this.server.to(socket.id).emit('newDelivery', currentDelivery);
        }
      }
    });
  }


  @SubscribeMessage('deliveryResponseAccept')
  async handleDeliveryResponse(@ConnectedSocket() client: UpdatedSocket, @MessageBody() data: {orderId: Types.ObjectId, userId: Types.ObjectId}){

    const { partnerId } = client.payload;
    const { orderId, userId } = data;

    const assigned = await this.redisService.isKeyExists(`deliveryResponse:${orderId}`)

    if(!assigned){

      // Seting in Redis for conflict Resolution
      await this.redisService.setData(`deliveryResponse:${orderId}`, 'ACCEPT', 5 * 60 * 1000);

      // Sending Acceptance Request
      this.server.to(client.id).emit('acknowledgement', {acknowledgement: true});

      // Updating Delivery Partner Status
      await this.midModuleService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);

      // Updating Delivery Status 
      await this.midModuleService.assignedPartner(partnerId, orderId);

      // Updating the Mapping 
      const userSocket = this.customersMap.get(userId);
      if(userSocket){
        this.trackingMap.set(partnerId, userSocket);
      }

    }else{
      this.server.to(client.id).emit('acknowledgement', {acknowledgement: false})
    }
  }

}
