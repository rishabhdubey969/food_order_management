import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatbotService } from './chatbot.service';

@WebSocketGateway()
export class ChatbotGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatbotService: ChatbotService) {}

  // Listen to 'message' event from client
  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
    const userMessage = data.message;
    const reply = await this.chatbotService.getResponse(userMessage);

    // Emit reply back to the same client
    client.emit('reply', { reply });
  }
}
