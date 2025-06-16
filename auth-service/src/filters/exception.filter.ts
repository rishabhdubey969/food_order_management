import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { AxiosError } from 'axios';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: Record<string, any> = {
      statusCode: status,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    // Handle MongoDB Duplicate Key Error
    if (exception instanceof MongoError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      responseBody = {
        ...responseBody,
        statusCode: status,
        message: 'Duplicate entry found',
        errorCode: 'DUPLICATE_KEY',
        fields: (exception as any).keyValue,
      };
    }

    // Handle Mongoose Validation Error
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      const details = Object.values(exception.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      responseBody = {
        ...responseBody,
        statusCode: status,
        message: 'Validation error',
        errorCode: 'VALIDATION_ERROR',
        details,
      };
    }

    // Handle Axios External API Error
    else if (exception?.isAxiosError) {
      const axiosEx = exception as AxiosError;
      status = axiosEx.response?.status || HttpStatus.BAD_GATEWAY;

      responseBody = {
        ...responseBody,
        statusCode: status,
        message: (axiosEx.response?.data as any)?.message || 'External API error',
        errorCode: 'EXTERNAL_API_ERROR',
        service: axiosEx.config?.url,
      };
    }

    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      responseBody = {
        ...responseBody,
        statusCode: status,
        ...(typeof response === 'string' ? { message: response } : response),
      };
    }

    // Log and respond
    this.logger.error(`[${req.method}] ${req.url} -> ${responseBody.message}`);

    res.status(status).json(responseBody);
  }
}
