import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ResponseMessageKey } from 'src/decorators/response-message.decorator';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class SimpleResponseInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const i18n = I18nContext.current();
    const lang = i18n?.lang ?? 'en';
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    const messageKey = this.reflector.get<string>(
      ResponseMessageKey,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        const translateData = `${lang}.${messageKey}`;

        const translatedMsg: string =
          i18n?.t(translateData) ?? messageKey ?? 'Success';

        const response = {
          statusCode,
          message: translatedMsg,
          data: data,
        };

        return response;
      }),
    );
  }
}
