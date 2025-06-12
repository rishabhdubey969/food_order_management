import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ManagerService } from 'src/manager/manager.service';
import { WsManagerGuard } from '../guard/websocket.guard';
import { KafkaService } from '../kafka/kafka.service';
import { ObjectId, Types } from 'mongoose';

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
    // Manager is already validated by the guard at this point
    const managerId = client.data.manager.id;
    
    this.connectedManagers.set(managerId, client);
    this.logger.log(`Manager ${managerId} connected`);
    
    // Optional: Fetch full manager details if needed
    // const fullManager = await this.managerService.getManagerById(managerId);
  }

  handleDisconnect(client: Socket & { data?: { manager?: { id: string } }}) {
    const managerId = client.data?.manager?.id;
    if (managerId) {
      this.connectedManagers.delete(managerId);
      this.logger.log(`Manager disconnected: ${managerId}`);
    }
  }

  async handleNewOrder(managerId: Types.ObjectId, cartData: any) {
    const managerSocket = this.connectedManagers.get(managerId);
    if (managerSocket) {
        managerSocket.emit('newOrder', cartData);

         managerSocket?.on('orderResponse', (data) => {
          return data;
        })
    }
  }

  // @SubscribeMessage('orderResponse')
  // async handleOrderResponse(@ConnectedSocket() client: Socket, @MessageBody() data: any){
  //   const {cartId, status} = data;
  //   this.kafkaService.handleEvent('response', {cartId: String, acknowledgement: status});
  // }


}
