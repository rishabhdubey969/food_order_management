import { createLogger, format, transports } from 'winston';
import * as path from 'path';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join('logs', 'combined.log') 
    }),
  ],
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join('logs', 'exceptions.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

export default logger;