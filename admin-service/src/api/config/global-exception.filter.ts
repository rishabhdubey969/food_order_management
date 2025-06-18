
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorType = 'InternalServerError';

  
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      errorType = exception.constructor.name;
    }
 
    else if (exception instanceof MongoError) {
      status = this.mapMongoError(exception);
      message = this.getMongoErrorMessage(exception);
      errorType = 'DatabaseError';
      this.logger.error(`MongoDB error: ${exception.message}`, exception.stack);
    }
 
    else if (exception instanceof Error) {
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
      errorType = exception.constructor.name;
      message = exception.message;
    }

   
    this.logger.error(
      `Error: ${message} | Path: ${request.url} | Stack: ${exception instanceof Error ? exception.stack : ''}`
    );

   
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorType,
      message: typeof message === 'string' ? message : (message as any).message,
      details: typeof message === 'object' ? message : undefined,
    });
  }

  private mapMongoError(error: MongoError): HttpStatus {
    switch (error.code) {
      case 11000: 
        return HttpStatus.CONFLICT;
      case 121: 
        return HttpStatus.BAD_REQUEST;
      case 13: 
        return HttpStatus.UNAUTHORIZED;
      case 18:
        return HttpStatus.UNAUTHORIZED;
      case 50: 
        return HttpStatus.REQUEST_TIMEOUT;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private getMongoErrorMessage(error: MongoError): string {
    switch (error.code) {
      case 11000:
        const keyMatch = error.message.match(/index: (.+?)_/);
        return keyMatch 
          ? `${keyMatch[1]} already exists` 
          : 'Duplicate key error';
      case 121:
        return 'Document validation failed';
      case 13:
      case 18:
        return 'Database authentication failed';
      case 50:
        return 'Database operation timed out';
      default:
        return 'Database operation failed';
    }
  }
}