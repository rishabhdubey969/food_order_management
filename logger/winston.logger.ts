import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike(), 
      ),
    }),
    new winston.transports.File({
        filename: 'logs/app.log',
        level: 'info', // Make sure you're logging at 'info' or lower (e.g., debug)
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
  ],
};
