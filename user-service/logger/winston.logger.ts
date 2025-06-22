import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logDirectory = path.join(__dirname, '../../logs');
const logRetentionDays = 7; // Retain logs for 7 days

// Ensure the log directory exists
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  dirname: logDirectory,
  filename: 'user-service-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '7d', // Keep logs for 7 days only
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

/**
 * Deletes log files older than the specified retention period.
 */
function deleteOldLogs() {
  fs.readdir(logDirectory, (err, files) => {
    if (err) {
      console.error('Error reading log directory:', err);
      return;
    }

    const currentDate = new Date();
    files.forEach((file) => {
      const filePath = path.join(logDirectory, file);

      // Check if the file is a log file (you can modify this based on your file naming convention)
      if (file.startsWith('user-service-') && file.endsWith('.log')) {
        const fileStats = fs.statSync(filePath);
        const fileModifiedTime = new Date(fileStats.mtime);

        // Calculate the difference in days between the current date and file's modified date
        const diffTime = currentDate.getTime() - fileModifiedTime.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24); // Convert milliseconds to days

        // If the file is older than the retention period, delete it
        if (diffDays > logRetentionDays) {
          fs.unlink(filePath, (deleteErr) => {
            if (deleteErr) {
              console.error(`Error deleting file ${file}:`, deleteErr);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      }
    });
  });
}

/**
 * Set up a periodic task to delete old logs every 24 hours.
 */
function startLogCleanupJob() {
  const cleanupInterval = 1000 * 60 * 60 * 24; // Run cleanup every 24 hours
  setInterval(deleteOldLogs, cleanupInterval);
}

// Start the log cleanup job
startLogCleanupJob();
