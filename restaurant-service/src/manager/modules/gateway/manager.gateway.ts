import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { KafkaService } from 'src/manager/kafka/kafka.service';
import { TokenService } from '../token/token.service';
import { ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { error } from 'console';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ManagerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ManagerGateway');
  private connectedManagers = new Map<string, Socket>();
  restaurantId: any;

  constructor(private readonly kafkaService: KafkaService,
    private readonly tokenService: TokenService
  ) { }
  /**
 * Handles new WebSocket connections from managers, authenticates them, and maintains connection state
 * 
 * @param client - The connected Socket.io client with augmented typing containing:
 *                - data.manager.id: The manager's ID (populated after authentication)
 * @throws {UnauthorizedException} - When no authorization token is provided
 * @description This method:
 * 1. Extracts JWT token from the connection's authorization header
 * 2. Verifies the token using the TokenService
 * 3. On successful authentication:
 *    - Stores the socket connection in connectedManagers Map (key: managerId)
 *    - Logs the successful connection
 * 4. On failure:
 *    - Disconnects the client socket
 *    - Logs the error (implicitly through the error handling)
 * @process Flow:
 *   - Client connects → Token verification → Connection stored/Rejected
 * @security Important authentication handler - rejects unauthenticated connections
 */
  async handleConnection(client: Socket & { data: { manager: { id: string } } }) {

    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_NOT_FOUND);
      }
      const payload = await this.tokenService.verifyToken(token, "access");
      const managerId = payload.sub.toString();

      this.connectedManagers.set(managerId, client);
      this.logger.log(`Manager ${managerId} connected`);
    } catch (err) {
      client.disconnect();
    }
  }

 /**
 * Verifies manager connection and requests order approval via WebSocket communication
 * 
 * @param managerId - The MongoDB ObjectId of the restaurant manager to notify
 * @param cartData - The order details containing items, quantities, and special requests.
 * @returns Promise<boolean> - Resolves to true if manager approves order, false if rejected
 * @throws {Error} - Throws specific errors in these cases:
 *                   - "Manager not connected" if no active WebSocket connection exists
 *                   - "Manager response timeout" if no response within 30 seconds
 * @description This asynchronous method handles the order approval workflow by:
 * 1. Validating the manager has an active WebSocket connection
 * 2. Emitting a 'newOrder' event with the order details
 * 3. Setting up a response listener for the 'orderResponse' event
 * 4. Managing a 30-second timeout for the response
 * 5. Cleaning up listeners and timeouts after response
 * @note The method maintains backward compatibility by returning errors rather than
 *       throwing when used in contexts expecting boolean returns
 */
  handleDisconnect(client: Socket & { data?: { manager?: { id: string } } }) {
    const managerId = client.data?.manager?.id;
    if (managerId) {
      this.connectedManagers.delete(managerId);
      this.logger.log(`Manager disconnected: ${managerId}`);
    }
  }
  /**
 * Checks the connection and emits the response through Kafka
 * 
 * @param managerId - The ID of the manager to check connection
 * @param cartData - The cart data to be sent to the manager for approval
 * @returns A promise that resolves to a boolean indicating if the food is available (approved)
 * @throws Error if manager is not connected or if there's a timeout waiting for response
 * @description This method:
 * 1. Checks if the manager is connected via WebSocket
 * 2. Emits a 'newOrder' event with the cart data to the manager
 * 3. Waits for an 'orderResponse' event from the manager
 * 4. Resolves with the approval status or rejects on timeout/error
 * 5. Has a 30-second timeout for manager response
 */
  async handleIsFoodAvailable(managerId: Types.ObjectId, cartData: any){
  
      const manId = managerId.toString()
    const managerSocket = this.connectedManagers.get(manId);
    if (!managerSocket) {
      throw new Error(ERROR_MESSAGES.MANAGER_NOT_CONNECTED);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(ERROR_MESSAGES.MANAGER_RESPONSE_TIMEOUT));
      }, 10000);
      managerSocket.emit('newOrder', cartData);
      const responseHandler = (data: any) => {
        clearTimeout(timeoutId);
        managerSocket.off('orderResponse', responseHandler);
        resolve(data.approved);
      };
      managerSocket.on('orderResponse', responseHandler);
    });}
    
  }

