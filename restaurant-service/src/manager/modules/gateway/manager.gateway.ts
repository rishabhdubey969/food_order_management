import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { KafkaService } from 'src/manager/kafka/kafka.service';
import { TokenService } from '../token/token.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})   
export class ManagerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ManagerGateway');
  private connectedManagers = new Map<string, Socket>();

  constructor(private readonly kafkaService: KafkaService,
    private readonly tokenService: TokenService
  ){}
  /**
   * Builds a connection
   */
  async handleConnection(client: Socket & { data: { manager: { id: string } } }) {

    const token = client.handshake.headers.authorization?.split(' ')[1];
    console.log(token);
    if(!token){
      throw new UnauthorizedException('No token provided');
    }
    const payload = await this.tokenService.verifyToken(token, "access");
    console.log(payload)
    const managerId = payload.sub.toString();
    
    this.connectedManagers.set(managerId , client);
    this.logger.log(`Manager ${managerId} connected`);
  }

  /**
   * Disconnect 
   */
  handleDisconnect(client: Socket & { data?: { manager?: { id: string } }}) {
    const managerId = client.data?.manager?.id;
    if (managerId) {
      this.connectedManagers.delete(managerId);
      this.logger.log(`Manager disconnected: ${managerId}`);
    }
  }

  /**
   * Checks the connection and emit the response through kafka
   */
  async handleIsFoodAvailable(managerId: Types.ObjectId, cartData: any): Promise<boolean> {
    const manId = managerId.toString()
    const managerSocket = this.connectedManagers.get(manId);
    if (!managerSocket) {
        throw new Error('Manager not connected');
    }

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Manager response timeout'));
        }, 30000); 
        managerSocket.emit('newOrder', cartData);
        const responseHandler = (data: { approved: boolean }) => {
            clearTimeout(timeoutId);
            managerSocket.off('orderResponse', responseHandler); 
            resolve(data.approved);
        };
        managerSocket.on('orderResponse', responseHandler);
    });
}
}
