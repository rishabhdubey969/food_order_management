
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LocationUpdate } from './interfaces/locationUpdateInterface';
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';
import { RedisService } from '../redis/redisService';
import { UpdatedSocket } from './interfaces/updatedSocketInterface';
import { CompleteDelivery, DriverLocationResult } from '../delivery/interfaces/deliveryInterfaces';
import { Role } from 'src/common/enums';
import { MidModuleService } from '../mid-module/mid-module.service';
import { TRACKING_CONSTANTS } from './trackingConstants';
import { TokenService } from '../token/token.service';
import { WebSocketGuard } from './guards/webSocketGuard';

@WebSocketGateway({
  cors: {
    origin: TRACKING_CONSTANTS.CONFIG.CORS_ORIGIN,
    allowedHeaders: ['*'],
    credentials: true
  }
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private deliveryPartnersMap: Map<Types.ObjectId, Socket> = new Map();
  private customersMap: Map<Types.ObjectId, Socket> = new Map();
  private trackingMap: Map<Types.ObjectId, Socket> = new Map();

  /**
   * Initializes the TrackingGateway with dependencies for Redis, mid-module services, token verification, and logging.
   *
   * Args:
   *   redisService (RedisService): Service for managing Redis operations.
   *   midModuleService (MidModuleService): Service for managing delivery partner status and assignments.
   *   tokenService (TokenService): Service for verifying JWT tokens.
   *   logger (Logger): Winston logger for logging gateway events.
   */
  constructor(
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => MidModuleService))
    private readonly midModuleService: MidModuleService,
    private readonly tokenService: TokenService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @UseGuards(WebSocketGuard)
  async handleConnection(client: UpdatedSocket) {
    /**
     * Handles a new WebSocket connection, authenticates the client, and maps them based on their role.
     *
     * Args:
     *   client (UpdatedSocket): The WebSocket client attempting to connect.
     *
     * Side Effects:
     *   - Authenticates the client using a JWT token.
     *   - Maps the client to deliveryPartnersMap or customersMap based on role.
     *   - Emits an error and disconnects if authentication or role validation fails.
     */
    this.logger.info('Client connection attempt', {
      service: 'TrackingGateway',
      method: 'handleConnection',
      socketId: client.id
    });

    const accessToken = client.handshake.headers.authorization?.split(' ')[1];
    
    if (!accessToken) {
      this.logger.warn('Access token not found in headers', {
        service: 'TrackingGateway',
        method: 'handleConnection',
        socketId: client.id
      });
      client.emit('error', { message: 'Unauthorized: No token provided' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.tokenService.verify(accessToken);
      client['payload'] = payload;
      
      this.logger.info('Client authenticated successfully', {
        service: 'TrackingGateway',
        method: 'handleConnection',
        socketId: client.id,
        payload: { role: payload.role, userId: payload.userId, partnerId: payload.partnerId }
      });
    } catch (error) {
      this.logger.error('JWT verification failed', {
        service: 'TrackingGateway',
        method: 'handleConnection',
        socketId: client.id,
        error: error.message,
        stack: error.stack
      });
      client.emit('error', { message: 'Unauthorized: Invalid or expired token' });
      client.disconnect(true);
      return;
    }
    
    const { role } = client.payload;

    if (!role) {
      this.logger.warn('Invalid role in payload', {
        service: 'TrackingGateway',
        method: 'handleConnection',
        socketId: client.id,
        payload: client.payload
      });
      client.disconnect(true);
      return;
    }

    try {
      if (role === Role.DELIVERY_PARTNER) {
        const { partnerId } = client.payload;
        if (!partnerId) {
          this.logger.warn('Invalid partnerId in payload', {
            service: 'TrackingGateway',
            method: 'handleConnection',
            socketId: client.id,
            payload: client.payload
          });
          client.disconnect(true);
          return;
        }
        this.deliveryPartnersMap.set(new ObjectId(partnerId), client);
        this.logger.info('Delivery partner connected', {
          service: 'TrackingGateway',
          method: 'handleConnection',
          partnerId,
          socketId: client.id
        });
      } else if (role === Role.USER) {
        const { userId } = client.payload;
        if (!userId) {
          this.logger.warn('Invalid userId in payload', {
            service: 'TrackingGateway',
            method: 'handleConnection',
            socketId: client.id,
            payload: client.payload
          });
          client.disconnect(true);
          return;
        }
        this.customersMap.set(new Types.ObjectId(userId), client);
        this.logger.info('User connected', {
          service: 'TrackingGateway',
          method: 'handleConnection',
          userId,
          socketId: client.id
        });
      } else {
        this.logger.warn('Unknown role detected', {
          service: 'TrackingGateway',
          method: 'handleConnection',
          socketId: client.id,
          role
        });
        client.disconnect(true);
      }
    } catch (error) {
      this.logger.error('Failed to handle connection', {
        service: 'TrackingGateway',
        method: 'handleConnection',
        socketId: client.id,
        error: error.message,
        stack: error.stack
      });
      client.disconnect(true);
    }
  }

  @UseGuards(WebSocketGuard)
  async handleDisconnect(client: UpdatedSocket) {
    /**
     * Handles a WebSocket client disconnection and cleans up mappings.
     *
     * Args:
     *   client (UpdatedSocket): The WebSocket client that disconnected.
     *
     * Side Effects:
     *   - Removes the client from deliveryPartnersMap, customersMap, or trackingMap based on role.
     *   - Updates Redis to remove the driver if applicable.
     */
    this.logger.info('Client disconnecting', {
      service: 'TrackingGateway',
      method: 'handleDisconnect',
      socketId: client.id
    });

    try {
      if (!client.payload) {
        this.logger.debug('Client disconnected without payload', {
          service: 'TrackingGateway',
          method: 'handleDisconnect',
          socketId: client.id
        });
        return;
      }

      const { role } = client.payload;

      if (role === Role.DELIVERY_PARTNER) {
        const { partnerId } = client.payload;
        if (partnerId) {
          this.deliveryPartnersMap.delete(new Types.ObjectId(partnerId));
          this.logger.info('Delivery partner disconnected', {
            service: 'TrackingGateway',
            method: 'handleDisconnect',
            partnerId,
            socketId: client.id
          });
          await this.redisService.removeDriver(partnerId.toHexString());
        }
      } else if (role === Role.USER) {
        const { userId } = client.payload;
        if (userId) {
          this.customersMap.delete(new Types.ObjectId(userId));
          this.logger.info('User disconnected', {
            service: 'TrackingGateway',
            method: 'handleDisconnect',
            userId,
            socketId: client.id
          });
        }
      }

      this.trackingMap.forEach((socket, pId) => {
        if (socket.id === client.id) {
          this.trackingMap.delete(pId);
          this.logger.info('Tracking mapping removed', {
            service: 'TrackingGateway',
            method: 'handleDisconnect',
            partnerId: pId,
            socketId: client.id
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to handle disconnection', {
        service: 'TrackingGateway',
        method: 'handleDisconnect',
        socketId: client.id,
        error: error.message,
        stack: error.stack
      });
    }
  }

  @UseGuards(WebSocketGuard)
  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.AVAILABLE_LOCATION_UPDATE)
  async handleAvailableLocationUpdate(
    @MessageBody() location: LocationUpdate,
    @ConnectedSocket() client: UpdatedSocket
  ) {
    /**
     * Handles location updates from available delivery partners and stores them in Redis.
     *
     * Args:
     *   location (LocationUpdate): The location data containing longitude and latitude.
     *   client (UpdatedSocket): The WebSocket client sending the update.
     *
     * Side Effects:
     *   - Updates the driver's location in Redis if their status is ONLINE.
     *   - Emits an error if the location data is invalid or the partner's status is not ONLINE.
     */
    this.logger.info('Available location update attempt', {
      service: 'TrackingGateway',
      method: 'handleAvailableLocationUpdate',
      socketId: client.id,
      partnerId: client.payload?.partnerId
    });

    if (!client.payload?.partnerId) {
      this.logger.warn('No partnerId in payload', {
        service: 'TrackingGateway',
        method: 'handleAvailableLocationUpdate',
        socketId: client.id
      });
      return;
    }

    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn('Invalid location data received', {
        service: 'TrackingGateway',
        method: 'handleAvailableLocationUpdate',
        socketId: client.id,
        partnerId: client.payload.partnerId,
        location
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA);
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      const status = await this.midModuleService.findStatus(partnerId);

      if (status === DeliveryPartnerStatus.ONLINE) {
        await this.redisService.addAvailableDriver(partnerId.toHexString(), location.longitude, location.latitude);
        this.logger.debug('Location updated in Redis', {
          service: 'TrackingGateway',
          method: 'handleAvailableLocationUpdate',
          partnerId,
          location
        });
      } else {
        this.logger.warn('Status mismatch for location update', {
          service: 'TrackingGateway',
          method: 'handleAvailableLocationUpdate',
          partnerId,
          currentStatus: status,
          requiredStatus: DeliveryPartnerStatus.ONLINE
        });
        client.emit(TRACKING_CONSTANTS.EVENTS.STATUS_MISMATCH, `Your status is ${status}, not ONLINE`);
      }
    } catch (error) {
      this.logger.error('Failed to update available location', {
        service: 'TrackingGateway',
        method: 'handleAvailableLocationUpdate',
        partnerId,
        error: error.message,
        stack: error.stack
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.LOCATION_UPDATE_FAILED);
    }
  }

  @UseGuards(WebSocketGuard)
  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.OCCUPIED_LOCATION_UPDATE)
  async handleAssignedLocationUpdate(
    @MessageBody() location: LocationUpdate,
    @ConnectedSocket() client: UpdatedSocket
  ) {
    /**
     * Handles location updates from assigned delivery partners and broadcasts them to the tracking customer.
     *
     * Args:
     *   location (LocationUpdate): The location data containing longitude and latitude.
     *   client (UpdatedSocket): The WebSocket client sending the update.
     *
     * Side Effects:
     *   - Emits the location update to the customer's socket if found in trackingMap.
     *   - Emits an error if the location data is invalid or no customer socket is found.
     */
    this.logger.info('Occupied location update attempt', {
      service: 'TrackingGateway',
      method: 'handleAssignedLocationUpdate',
      socketId: client.id,
      partnerId: client.payload?.partnerId
    });

    if (!client.payload?.partnerId) {
      this.logger.warn('No partnerId in payload', {
        service: 'TrackingGateway',
        method: 'handleAssignedLocationUpdate',
        socketId: client.id
      });
      return;
    }

    if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
      this.logger.warn('Invalid location data received', {
        service: 'TrackingGateway',
        method: 'handleAssignedLocationUpdate',
        socketId: client.id,
        partnerId: client.payload.partnerId,
        location
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_LOCATION_DATA);
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);

    try {
      const userSocket = this.trackingMap.get(partnerId);
      if (userSocket) {
        this.server.to(userSocket.id).emit(TRACKING_CONSTANTS.EVENTS.TRACKING_UPDATE, location);
        this.logger.debug('Tracking update sent to customer', {
          service: 'TrackingGateway',
          method: 'handleAssignedLocationUpdate',
          partnerId,
          customerSocketId: userSocket.id,
          location
        });
      } else {
        this.logger.warn('No customer socket found for tracking', {
          service: 'TrackingGateway',
          method: 'handleAssignedLocationUpdate',
          partnerId
        });
      }
    } catch (error) {
      this.logger.error('Failed to update assigned location', {
        service: 'TrackingGateway',
        method: 'handleAssignedLocationUpdate',
        partnerId,
        error: error.message,
        stack: error.stack
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ERROR, TRACKING_CONSTANTS.MESSAGES.ERROR.ASSIGNED_UPDATE_FAILED);
    }
  }

  async broadcastRequest(deliveryPartnersList: DriverLocationResult, currentDelivery: CompleteDelivery) {
    /**
     * Broadcasts a new delivery request to a list of delivery partners.
     *
     * Args:
     *   deliveryPartnersList (DriverLocationResult): List of delivery partner IDs to broadcast to.
     *   currentDelivery (CompleteDelivery): The delivery details to send.
     *
     * Side Effects:
     *   - Emits the delivery request to each partner's socket if found in deliveryPartnersMap.
     */
    this.logger.info('Broadcasting delivery request', {
      service: 'TrackingGateway',
      method: 'broadcastRequest',
      orderId: currentDelivery?.orderId,
      partnerCount: deliveryPartnersList?.length
    });

    if (!deliveryPartnersList) {
      this.logger.warn('No delivery partners list provided', {
        service: 'TrackingGateway',
        method: 'broadcastRequest',
        orderId: currentDelivery?.orderId
      });
      return;
    }

    try {
      deliveryPartnersList.forEach((partnerId) => {
        if (partnerId) {
          const socket = this.deliveryPartnersMap.get(partnerId);
          if (socket) {
            this.server.to(socket.id).emit(TRACKING_CONSTANTS.EVENTS.NEW_DELIVERY, currentDelivery);
            this.logger.debug('New delivery sent to partner', {
              service: 'TrackingGateway',
              method: 'broadcastRequest',
              orderId: currentDelivery.orderId,
              partnerId,
              socketId: socket.id
            });
          } else {
            this.logger.warn('Partner socket not found', {
              service: 'TrackingGateway',
              method: 'broadcastRequest',
              partnerId
            });
          }
        }
      });
      
      this.logger.info('Broadcast completed', {
        service: 'TrackingGateway',
        method: 'broadcastRequest',
        orderId: currentDelivery?.orderId
      });
    } catch (error) {
      this.logger.error('Failed to broadcast delivery request', {
        service: 'TrackingGateway',
        method: 'broadcastRequest',
        orderId: currentDelivery?.orderId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  @UseGuards(WebSocketGuard)
  @SubscribeMessage(TRACKING_CONSTANTS.EVENTS.DELIVERY_RESPONSE_ACCEPT)
  async handleDeliveryResponse(
    @ConnectedSocket() client: UpdatedSocket,
    @MessageBody() data: { orderId: Types.ObjectId; userId: Types.ObjectId }
  ) {
    /**
     * Handles a delivery partner's acceptance of a delivery request.
     *
     * Args:
     *   client (UpdatedSocket): The WebSocket client responding to the delivery request.
     *   data ({ orderId: Types.ObjectId; userId: Types.ObjectId }): The order and user IDs associated with the delivery.
     *
     * Side Effects:
     *   - Marks the order as accepted in Redis if unassigned.
     *   - Updates the partner's status and assigns the delivery.
     *   - Notifies the customer of the driver assignment.
     *   - Emits an acknowledgment or error to the partner.
     */
    this.logger.info('Delivery response attempt', {
      service: 'TrackingGateway',
      method: 'handleDeliveryResponse',
      socketId: client.id,
      partnerId: client.payload?.partnerId,
      orderId: data?.orderId
    });

    if (!client.payload?.partnerId) {
      this.logger.warn('No partnerId in payload', {
        service: 'TrackingGateway',
        method: 'handleDeliveryResponse',
        socketId: client.id
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, {
        acknowledgement: false,
        error: TRACKING_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED_PARTNER
      });
      return;
    }

    if (!data || !data.orderId || !data.userId) {
      this.logger.warn('Invalid response data', {
        service: 'TrackingGateway',
        method: 'handleDeliveryResponse',
        socketId: client.id,
        partnerId: client.payload.partnerId,
        data
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, {
        acknowledgement: false,
        error: TRACKING_CONSTANTS.MESSAGES.ERROR.INVALID_RESPONSE_DATA
      });
      return;
    }

    const partnerId = new Types.ObjectId(client.payload.partnerId);
    const { orderId, userId } = data;

    try {
      const assigned = await this.redisService.isKeyExists(`${TRACKING_CONSTANTS.REDIS.DELIVERY_RESPONSE_PREFIX}${orderId.toHexString()}`);

      if (!assigned) {
        this.logger.info('Accepting unassigned order', {
          service: 'TrackingGateway',
          method: 'handleDeliveryResponse',
          orderId,
          partnerId
        });

        await this.redisService.setData(
          `${TRACKING_CONSTANTS.REDIS.DELIVERY_RESPONSE_PREFIX}${orderId.toHexString()}`,
          'ACCEPT',
          TRACKING_CONSTANTS.REDIS.TTL_MS
        );

        client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, {
          acknowledgement: true,
          message: TRACKING_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_ACCEPTED
        });

        // await this.midModuleService.updateStatus(partnerId, DeliveryPartnerStatus.OCCUPIED);
        await this.midModuleService.assignedPartner(partnerId, orderId);

        const userSocket = this.customersMap.get(userId);
        if (userSocket) {
          this.trackingMap.set(partnerId, userSocket);
          this.server.to(userSocket.id).emit(TRACKING_CONSTANTS.EVENTS.DRIVER_ASSIGNED, { orderId, partnerId });
          this.logger.info('Driver assigned and customer notified', {
            service: 'TrackingGateway',
            method: 'handleDeliveryResponse',
            orderId,
            partnerId,
            userId
          });
        } else {
          this.logger.warn('Customer socket not found', {
            service: 'TrackingGateway',
            method: 'handleDeliveryResponse',
            userId
          });
        }
      } else {
        this.logger.warn('Order already assigned', {
          service: 'TrackingGateway',
          method: 'handleDeliveryResponse',
          orderId,
          partnerId
        });
        client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, {
          acknowledgement: false,
          error: TRACKING_CONSTANTS.MESSAGES.ERROR.ORDER_ALREADY_ASSIGNED
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle delivery response', {
        service: 'TrackingGateway',
        method: 'handleDeliveryResponse',
        orderId,
        partnerId,
        error: error.message,
        stack: error.stack
      });
      client.emit(TRACKING_CONSTANTS.EVENTS.ACKNOWLEDGEMENT, {
        acknowledgement: false,
        error: TRACKING_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED
      });
    }
  }
}