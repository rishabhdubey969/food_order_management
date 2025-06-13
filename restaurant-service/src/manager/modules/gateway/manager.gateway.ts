import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { KafkaService } from 'src/manager/kafka/kafka.service';

@WebSocketGateway({
  namespace: '/manager',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
  transports: ['websocket']
})   
export class ManagerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  [x: string]: any;
  @WebSocketServer() server: Server;
  private logger = new Logger('ManagerGateway');
  private connectedManagers = new Map<Types.ObjectId, Socket>();

  constructor(private readonly kafkaService: KafkaService){}

  async handleConnection(client: Socket & { data: { manager: { id: string } } }) {
    const managerId = client.data.manager.id;
    
    this.connectedManagers.set(managerId, client);
    this.logger.log(`Manager ${managerId} connected`);
  }

  handleDisconnect(client: Socket & { data?: { manager?: { id: string } }}) {
    const managerId = client.data?.manager?.id;
    if (managerId) {
      this.connectedManagers.delete(managerId);
      this.logger.log(`Manager disconnected: ${managerId}`);
    }
  }
  async handleIsFoodAvailable(managerId: Types.ObjectId, cartData: any): Promise<boolean> {
    const managerSocket = this.connectedManagers.get(managerId);
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
