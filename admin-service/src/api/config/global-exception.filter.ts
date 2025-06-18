// // src/config/global-exception.filter.ts
// import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
// import { Response } from 'express';
// import { ErrorHandler } from './error-handler';

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   private readonly logger = new Logger(GlobalExceptionFilter.name);

//   catch(exception: any, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const status = exception instanceof HttpException
//       ? exception.getStatus()
//       : HttpStatus.INTERNAL_SERVER_ERROR;
//     const message = exception.message || 'Internal server error';

//     this.logger.error(`Exception: ${message}`, exception.stack);
//     response.status(status).json({
//       status: 'error',
//       message,
//     });
//   }
// }import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ErrorHandler } from './error-handler';
import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: {
      status: number;
      message: string | string[];
    } = {
      status: HttpStatus.INTERNAL_SERVER_ERROR, // Default to 500
      message: 'Internal server error', // Default initialization
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      if (exception instanceof BadRequestException) {
        const exceptionResponse = exception.getResponse();
        const messageValue = typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? Array.isArray(exceptionResponse.message) ? exceptionResponse.message : [exceptionResponse.message]
          : typeof exceptionResponse === 'string' ? [exceptionResponse] : ['Validation failed'];
        errorResponse = {
          status: status, // Use the dynamic status code
          message: messageValue,
        };
      } else {
        errorResponse = {
          status: status, // Use the dynamic status code
          message: exception.message || 'Unexpected error',
        };
      }
    }

    this.logger.error(`Exception: ${Array.isArray(errorResponse.message) ? errorResponse.message.join(', ') : errorResponse.message}`, exception.stack);
    response.status(status).json(errorResponse);
  }
}