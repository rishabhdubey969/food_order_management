import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Handles incoming messages from the client and returns a response from the chatbot.
   *
   * @param message - The message sent by the user.
   * @returns An object containing the chatbot's reply.
   */
  @Post('message')
  async handleMessage(@Body('message') message: string) {
   // console.log(message);
    const reply = await this.chatbotService.getResponse(message);
    return { reply };
  }
}
