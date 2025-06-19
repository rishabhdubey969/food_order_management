import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

const logDirectory = path.join(__dirname, '../../logs');

// Ensure the log directory exists
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  dirname: logDirectory,
  filename: 'user-service-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '7d', // keep logs for 7 days only
});

/**
 * Winston logger configuration for the user service.
 * It logs messages to both the console and a daily rotating file.
 */
export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}] ${message}`),
  ),
  transports: [new winston.transports.Console(), dailyRotateFileTransport],
});
