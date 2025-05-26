// src/config/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ErrorHandler } from './error-handler';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    try {
      ErrorHandler.handleError(exception);
    } catch (error) {
      if (error instanceof HttpException) {
        response.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        response.status(500).json({
          statusCode: 500,
          message: 'An unexpected error occurred',
        });
      }
    }
  }
}