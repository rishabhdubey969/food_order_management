import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import DailyRotateFile = require('winston-daily-rotate-file');


export const winstonLoggerConfig: WinstonModuleOptions = {
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../../../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '7d', // Keep logs for 7 days
      zippedArchive: false,
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, '../../../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxFiles: '7d', // Keep logs for 7 days
      zippedArchive: false,
    }),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    }),
  ),
};

