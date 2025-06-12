import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('app') 
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name); // Instantiate logger

  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Get a simple greeting message' }) // Swagger operation summary
  @ApiResponse({ status: 200, description: 'Returns "Hello World!"' }) // Swagger response description
  @Get()
  getHello(): string {
    this.logger.log('Attempting to retrieve greeting message.'); // Log entry
    try {
      const message = this.appService.getHello();
      this.logger.log('Successfully retrieved greeting message.'); // Log success
      return message;
    } catch (error) {
      this.logger.error('Error retrieving greeting message.', error.stack); // Log error with stack trace
      // In a real application, you might throw a specific HTTP exception here
      throw error; // Re-throw the error after logging it
    }
  }
}