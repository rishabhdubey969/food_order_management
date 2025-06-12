import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name); 

  getHello(): string {
    this.logger.log('Attempting to get "Hello World!" message from AppService.'); 
    try {
      const message = 'Hello World!';
      this.logger.log('Successfully retrieved "Hello World!" message.'); 
      return message;
    } catch (error) {
      this.logger.error('Error in getHello() method of AppService.', error.stack); 
      throw error; 
    }
  }
}