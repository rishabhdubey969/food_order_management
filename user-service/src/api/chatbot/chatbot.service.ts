import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChatbotService {
  private readonly witToken = 'YEBCOIMRD3UBUGJYXZRLNWKLUZCMQNON';

  constructor(private readonly httpService: HttpService) {}

  async getResponse(message: string): Promise<string> {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.wit.ai/message?v=20230401&q=${encodedMessage}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${this.witToken}` },
        }),
      );

      console.log('Wit.ai response:', response.data);

      const intents = response?.data?.intents;
      console.log('Intents:', intents);

      if (intents && intents.length > 0) {
        const intentName = intents[0].name;
        return `I understood your intent is: ${intentName}`;
      }

      return "Sorry, I didn't understand that. Can you rephrase?";
    } catch (error) {
      console.error('Wit.ai API error', error);
      return 'Sorry, I am having trouble understanding you right now.';
    }
  }
}
