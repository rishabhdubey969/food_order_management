import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nContext } from 'nestjs-i18n';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private httpAdapterHost: HttpAdapterHost) {}
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    console.log('hello', exception)
    const ctx = host.switchToHttp();
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let type: string | string[];
    let error = 'Sorry, something went wrong';
    let msg = exception?.['response']?.message ?? exception;
    let msgType;
    const { httpAdapter } = this.httpAdapterHost;
    const path = httpAdapter.getRequestUrl(ctx.getRequest());

    // Custom handling for MongoError duplicate key
    if (exception instanceof MongoError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      const responseBody = {
        statusCode: status,
        message: 'Duplicate entry found',
        errorCode: 'DUPLICATE_KEY',
        fields: (exception as any).keyValue,
      };
      this.logger.error(responseBody);
      return httpAdapter.reply(ctx.getResponse(), responseBody, status);
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      const details = Object.values(exception.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      const responseBody = {
        statusCode: status,
        message: 'Validation error',
        errorCode: 'VALIDATION_ERROR',
        details,
      };
      this.logger.error(responseBody);
      return httpAdapter.reply(ctx.getResponse(), responseBody, status);
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      status = res['statusCode'] ? res['statusCode'] : status;
      const i18n = I18nContext.current();
      if (i18n) {
        type = res['message'];
        if (type instanceof Array) {
          msg = type[0];
        } else if (type) {
          const lang = i18n.lang;
          msgType = type;

          const translateMsgType = `${lang}.${msgType}`;

          const translatedMsg = i18n.t(translateMsgType);
          const message =
            translatedMsg !== translateMsgType ? translatedMsg : msgType;
          msg = message as string;
        }
      }
      error = res['error'];
    }

    const errorBody = {
      statusCode: status,
      error: msgType || 'VALIDATION_ERROR',
      message: msg,
      type: error,
    };

    this.logger.error(errorBody);

    httpAdapter.reply(ctx.getResponse(), errorBody, status);
  }
}

