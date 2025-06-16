
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { LocationUpdate } from './interfaces/locationUpdateInterface';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { RedisService } from '../redis/redisService';
import { UpdatedSocket } from './interfaces/updatedSocketInterface';
import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
import { Role } from 'src/common/enums';
import { MidModuleService } from '../mid-module/mid-module.service';
import { TRACKING_CONSTANTS } from './trackingConstants';
import { TokenService } from '../token/token.service';



@WebSocketGateway(
  { cors: 
    { origin: TRACKING_CONSTANTS.CONFIG.CORS_ORIGIN, 
      allowedHeaders: ['*'],
      credentials: true
    }
  }
)

export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private deliveryPartnersMap: Map<Types.ObjectId, Socket> = new Map();
  private customersMap: Map<Types.ObjectId, Socket> = new Map();
  private trackingMap: Map<Types.ObjectId, Socket> = new Map();

  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => MidModuleService))
    private readonly midModuleService: MidModuleService,
    private readonly tokenService: TokenService
  ) {}


 
  async handleConnection(client: UpdatedSocket) {

    const accessToken = client.handshake.headers.authorization?.split(' ')[1];
    
    if (!accessToken) {
      this.logger.warn('Access token not found in headers');
      client.emit('error', { message: 'Unauthorized: No token provided' });
      client.disconnect(true);
      return;
    }

    let payload: any;
    try {
      payload = await this.tokenService.verify(accessToken);
      client['payload'] = payload;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error.message}`);
      client.emit('error', { message: 'Unauthorized: Invalid or expired token' });
      client.disconnect(true);
      return;
    }
    
    
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CONNECTED}: ${client.id}`);
    
      const { role } = client.payload;

      if (!role) {
        this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_ROLE}: ${client.id}`);
        client.disconnect(true);
        return;
      }

      if (role === Role.DELIVERY_PARTNER) {
        const { partnerId } = client.payload;
        if (!partnerId) {
          this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_PARTNER_ID}: ${client.id}`);
          client.disconnect(true);
          return;
        }
        this.deliveryPartnersMap.set(new ObjectId(partnerId), client);
        this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_PARTNER_CONNECTED}: ${partnerId}`);
      } else if (role === Role.USER) {
        const { userId } = client.payload;
        if (!userId) {
          this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_USER_ID}: ${client.id}`);
          client.disconnect(true);
          return;
        }
        this.customersMap.set(new Types.ObjectId(userId), client);
        this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.USER_CONNECTED}: ${userId}`);
      } else {
        this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.UNKNOWN_ROLE}: ${role}. Disconnecting: ${client.id}`);
        client.disconnect(true);
      }
  }

  async handleDisconnect(client: UpdatedSocket) {
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.CLIENT_DISCONNECTED}: ${client.id}`);
    try {
      if (!client.payload) {
        return;
      }
      const { role } = client.payload;

      if (role === Role.DELIVERY_PARTNER) {
        const { partnerId } = client.payload;
        if (partnerId) {
          this.deliveryPartnersMap.delete(new Types.ObjectId(partnerId));
          this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_PARTNER_DISCONNECTED}: ${partnerId}`);
          await this.redisService.removeDriver(partnerId.toHexString());
        }
      } else if (role === Role.USER) {
        const { userId } = client.payload;
        if (userId) {
          this.customersMap.delete(new Types.ObjectId(userId));
          this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.USER_DISCONNECTED}: ${userId}`);
        }
      }

      this.trackingMap.forEach((socket, pId) => {
        if (socket.id === client.id) {
          this.trackingMap.delete(pId);
          this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.TRACKING_REMOVED}: ${pId}`);
        }
      });
    } catch (error) {
      this.logger.error(`${TRACKING_CONSTANTS.MESSAGES.ERROR.DISCONNECTION_FAILED}: ${client.id}: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.AVAILABLE_LOCATION_UPDATE)
  async handleAvailableLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket) {
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.LOCATION_UPDATE_ATTEMPT}: ${client.payload?.partnerId} (Socket ID: ${client.id})`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_PARTNER_ID}: ${client.id}`);
      return;
    }
    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA}: ${client.payload.partnerId}: ${JSON.stringify(location)}`);
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA);
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      const status = await this.midModuleService.findStatus(partnerId);

      if (status === DeliveryPartnerStatus.ONLINE) {
        await this.redisService.addAvailableDriver(partnerId.toHexString(), location.longitude, location.latitude);
        this.logger.debug(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.LOCATION_UPDATED}: ${partnerId} [${location.longitude}, ${location.latitude}]`);
      } else {
        this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.STATUS_MISMATCH}: ${partnerId} status is ${status}`);
        client.emit(TRACKING_CONSTANTS.EVENTS.STATUS_MISMATCH, `Your status is ${status}, not ONLINE`);
      }
    } catch (error) {
      this.logger.error(`${TRACKING_CONSTANTS.MESSAGES.ERROR.LOCATION_UPDATE_FAILED}: ${partnerId}: ${error.message}`, error.stack);
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.LOCATION_UPDATE_FAILED);
    }
  }

  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.OCCUPIED_LOCATION_UPDATE)
  async handleAssignedLocationUpdate(@MessageBody() location: LocationUpdate, @ConnectedSocket() client: UpdatedSocket) {
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.ASSIGNED_UPDATE_ATTEMPT}: ${client.payload?.partnerId} (Socket ID: ${client.id})`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_PARTNER_ID}: ${client.id}`);
      return;
    }
    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA}: ${client.payload.partnerId}: ${JSON.stringify(location)}`);
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA);
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      const userSocket = this.trackingMap.get(partnerId);
      if (userSocket) {
        this.server.to(userSocket.id).emit(TRACKING_CONSTANTS.EVENTS.TRACKING_UPDATE, location);
        this.logger.debug(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.TRACKING_UPDATE_SENT}: ${userSocket.id} for partner ${partnerId}`);
      } else {
        this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_CUSTOMER_TRACKING}: ${partnerId}`);
      }
    } catch (error) {
      this.logger.error(`${TRACKING_CONSTANTS.MESSAGES.ERROR.ASSIGNED_UPDATE_FAILED}: ${partnerId}: ${error.message}`, error.stack);
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.ASSIGNED_UPDATE_FAILED);
    }
  }

  async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery) {
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.BROADCAST_ATTEMPT}: ${currentDelivery?.orderId} to ${deliveryPartnersList?.length} partners`);
    if (!deliveryPartnersList) {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_DELIVERY_PARTNERS}: ${currentDelivery?.orderId}`);
      return;
    }

    deliveryPartnersList.forEach((partnerId) => {
      if (partnerId) {
        const socket = this.deliveryPartnersMap.get(partnerId);
        if (socket) {
          this.server.to(socket.id).emit(TRACKING_CONSTANTS.EVENTS.NEW_DELIVERY, currentDelivery);
          this.logger.debug(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.NEW_DELIVERY_SENT}: ${currentDelivery.orderId} to partner ${partnerId} (Socket ID: ${socket.id})`);
        } else {
          this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.PARTNER_SOCKET_NOT_FOUND}: ${partnerId}`);
        }
      }
    });
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.BROADCAST_COMPLETED}: ${currentDelivery?.orderId}`);
  }

  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.DELIVERY_RESPONSE_ACCEPT)
  async handleDeliveryResponse(@ConnectedSocket() client: UpdatedSocket, @MessageBody() data: { orderId: Types.ObjectId; userId: Types.ObjectId }) {
    this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_RESPONSE_ATTEMPT}: ${client.payload?.partnerId} for order ${data?.orderId}`);
    if (!client.payload?.partnerId) {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_PARTNER_ID}: ${client.id}`);
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, { acknowledgement: false, error: TRACKING_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED_PARTNER });
      return;
    }
    if (!data || !data.orderId || !data.userId) {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_RESPONSE_DATA}: ${client.payload.partnerId}: ${JSON.stringify(data)}`);
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, { acknowledgement: false, error: TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_RESPONSE_DATA });
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);
    const { orderId, userId } = data;

    const assigned = await this.redisService.isKeyExists(`${TRACKING_CONSTANTS.REDIS.DELIVERY_RESPONSE_PREFIX}${orderId.toHexString()}`);
    if (!assigned) {
      this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.WARN.ORDER_NOT_ASSIGNED}: ${orderId}. Partner ${partnerId} is accepting`);

      await this.redisService.setData(
        `${TRACKING_CONSTANTS.REDIS.DELIVERY_RESPONSE_PREFIX}${orderId.toHexString()}`,
        'ACCEPT',
        TRACKING_CONSTANTS.REDIS.TTL_MS
      );
      this.logger.debug(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_RESPONSE_SET}: ${orderId}`);

      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, { acknowledgement: true, message: TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_ACCEPTED });
      this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_ACCEPTED}: ${partnerId} for order ${orderId}`);

      await this.midModuleService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);
      this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.PARTNER_STATUS_UPDATED}: ${partnerId}`);

      await this.midModuleService.assignedPartner(partnerId, orderId);
      this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED}: ${partnerId} to order ${orderId}`);

      const userSocket = this.customersMap.get(userId);
      if (userSocket) {
        this.trackingMap.set(partnerId, userSocket);
        this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.TRACKING_MAP_UPDATED}: ${partnerId} with customer ${userId}`);
        this.server.to(userSocket.id).emit(TRACKING_CONSTANTS.EVENTS.DRIVER_ASSIGNED, { orderId, partnerId });
        this.logger.log(`${TRACKING_CONSTANTS.MESSAGES.SUCCESS.DRIVER_ASSIGNED}: ${userId} for order ${orderId}`);
      } else {
        this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.WARN.NO_CUSTOMER_SOCKET}: ${userId}`);
      }
    } else {
      this.logger.warn(`${TRACKING_CONSTANTS.MESSAGES.ERROR.ORDER_ALREADY_ASSIGNED}: ${orderId}. Partner ${partnerId}'s acceptance rejected`);
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, { acknowledgement: false, error: TRACKING_CONSTANTS.MESSAGES.ERROR.ORDER_ALREADY_ASSIGNED });
    }
  }
}