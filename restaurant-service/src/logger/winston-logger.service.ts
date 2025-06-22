import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class WinstonLogger extends ConsoleLogger {
  logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`,
      ),
    ),
    transports: [
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d',
      }),
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d',
      }),
      
      new transports.Console(),
    ],
  });

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(`${message}${trace ? ` - TRACE: ${trace}` : ''}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
