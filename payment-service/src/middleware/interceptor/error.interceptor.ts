import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { HttpException, Logger } from '@nestjs/common';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        
        this.logger.error('Error intercepted:');

        if (err instanceof HttpException) {
          return throwError(() => err);
        }

        return throwError(() => new HttpException('An unexpected error occurred', 500));
      }),
    );
  }
}