import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { marked } from 'marked';

const GEMINI_MODEL = 'gemini-1.5-flash';
@Injectable()
export class ChatbotService {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(configService: ConfigService) {
    const geminiApiKey = configService.get('SECRECT_KEY_GEMINI');
    this.googleAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.googleAI.getGenerativeModel({
      model: GEMINI_MODEL,
    });
  }

  async getResponse(message) {
    const prompt = `Is this message food-related? Respond with only "yes" or "no": "${message}"`;
    const result = await this.model.generateContent(prompt);
    const isFood = result.response.text().trim().toLowerCase() === 'yes';
    if (!isFood) {
      return '🍽️ Hello! I’m your food assistant. I can help with menu items, dish details, or anything food-related. Please ask me something about food!';
    } else {
      const result = await this.model.generateContent(message);
      const responseText = result.response.text().trim();
       const isTable = responseText.includes('|') && responseText.includes('\n');
      const isMarkdown = responseText.includes('*') || responseText.includes('**') || responseText.includes('-');

      if (isTable || isMarkdown) {
        const htmlContent = marked.parse(responseText);
        return  htmlContent;
      }

      return responseText;
    }
  }
}
