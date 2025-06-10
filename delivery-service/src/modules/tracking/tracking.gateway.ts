
import { UseGuards } from '@nestjs/common';
import { WebSocketGuard } from './guards/webSocketGuard';
import { Server } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Role } from 'src/common/enums';
import { LocationUpdate } from './interfaces/locationUpdateInterface';
import { DeliveryPartnerService } from '../deliveryPartner/deliveryPartnerService';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { RedisService } from '../redis/redisService';
import { UpdatedSocket } from './interfaces/updatedSocketInterface';
import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
import { DeliveryService } from '../delivery/delivery.service';



@UseGuards(WebSocketGuard)
@WebSocketGateway({
  cors:{
    origin: 'localhost:5173'
  }
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() 
  server: Server

  private deliveryPartners: Map<string, string>;
  private customers: Map<string, string>;
  private tracking: Map<string, string>;

  constructor(
    deliveryPartners = new Map(),
    customers = new Map(),
    tracking = new Map(),

    private readonly deliverPartnerService: DeliveryPartnerService,
    private readonly redisService: RedisService,
    private readonly deliveryService: DeliveryService
  ){}

  handleConnection(client: UpdatedSocket){
      const { role } = client.payload;

      if(role === Role.DELIVERY_PARTNER){
        const { partnerId } = client.payload;
        this.deliveryPartners.set(partnerId, client.id);
      }

      else if(role === Role.USER){
        const { userId } = client.payload;
        this.customers.set(userId, client.id);
      }
  }

  handleDisconnect(client: UpdatedSocket) {
      const { role } = client.payload;

      if(role === Role.DELIVERY_PARTNER){
        const { partnerId } = client.payload;
        this.deliveryPartners.delete(partnerId);
      }

      else if(role === Role.USER){
        const { userId } = client.payload;
        this.customers.delete(userId);
      }
  }

  @SubscribeMessage('availableLocationUpdate')
  async handleAvailableLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){

    const { partnerId } = client.payload;
    const status = await this.deliverPartnerService.findStatus(partnerId);

    if(status === DeliveryPartnerStatus.ONLINE){
      await this.redisService.addAvailableDriver(partnerId, location.longitude, location.latitude);
      console.log(`Updated available driver ${partnerId} location: [${location.longitude}, ${location.latitude}]`);
    }

  }

  // Tracking Part
  @SubscribeMessage('occupiedLocationUpdate')
  async handleAssignedLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket){
    const { partnerId } = client.payload;
    const userSocketId = this.tracking.get(partnerId);
    if(userSocketId){
      await this.server.to(userSocketId).emit('trackingUpdate', location);
    }
  }

  async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery){

    deliveryPartnersList.forEach((partnerId) => {
      if(partnerId != null){
        this.server.to(`${this.deliveryPartners.get(partnerId)}`).emit('newDelivery', currentDelivery)
      }
    });
  }


  @SubscribeMessage('deliveryResponseAccept')
  async handleDeliveryResponse(@ConnectedSocket() client: UpdatedSocket, @MessageBody() data: {orderId: string, userId: string}){

    const { partnerId } = client.payload;
    const { orderId, userId } = data;

    const assigned = await this.redisService.isKeyExists(`deliveryResponse:${orderId}`)

    if(!assigned){

      // Seting in Redis for conflict Resolution
      await this.redisService.setData(`deliveryResponse:${orderId}`, 'ACCEPT', 300);

      // Sending Acceptance Request
      this.server.to(client.id).emit('acknowledgement', {acknowledgement: true});

      // Updating Delivery Partner Status
      await this.deliverPartnerService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);

      // Updating Delivery Status 
      await this.deliveryService.assignedPartner(partnerId, orderId);

      // Updating the Mapping 
      const userSocketId = this.customers.get(userId);
      if(userSocketId){
        this.tracking.set(partnerId, userSocketId);
      }

    }else{
      this.server.to(client.id).emit('acknowledgement', {acknowledgement: false})
    }
  }

}
