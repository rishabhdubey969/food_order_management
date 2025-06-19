import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { AxiosError } from 'axios';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: Record<string, any> = {
      statusCode: status,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    // Mongo Duplicate Key Error
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

    // Mongoose Validation Error
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

    // Axios External API Error
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

    // gRPC Error
    else if (typeof exception?.code === 'number' && exception?.details) {
      const grpcCode = exception.code;

      switch (grpcCode) {
        case GrpcStatus.UNAVAILABLE:
          status = HttpStatus.SERVICE_UNAVAILABLE;
          responseBody = {
            ...responseBody,
            statusCode: status,
            message: 'Dependent service is unavailable',
            errorCode: 'GRPC_SERVICE_UNAVAILABLE',
          };
          break;

        case GrpcStatus.DEADLINE_EXCEEDED:
          status = HttpStatus.REQUEST_TIMEOUT;
          responseBody = {
            ...responseBody,
            statusCode: status,
            message: 'Request to service timed out',
            errorCode: 'GRPC_TIMEOUT',
          };
          break;

        case GrpcStatus.NOT_FOUND:
          status = HttpStatus.NOT_FOUND;
          responseBody = {
            ...responseBody,
            statusCode: status,
            message: 'Resource not found in RPC call',
            errorCode: 'GRPC_NOT_FOUND',
          };
          break;

        default:
          status = HttpStatus.BAD_GATEWAY;
          responseBody = {
            ...responseBody,
            statusCode: status,
            message: exception.details || 'RPC error occurred',
            errorCode: `GRPC_ERROR_${grpcCode}`,
          };
          break;
      }
    }

    // NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      responseBody = {
        ...responseBody,
        statusCode: status,
        ...(typeof response === 'string' ? { message: response } : (response as object)),
      };
    }

    // Final log and return
    this.logger.error(`[${req.method}] ${req.url} -> ${responseBody.message}`);

    res.status(status).json(responseBody);
  }
}
