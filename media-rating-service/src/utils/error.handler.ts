import { Logger } from './logger';
import { Response } from 'express';
import { CONSTANTS } from '../constant/ratingConstant'; // Assuming the globalMessage is properly typed
import { AppError } from './appError';

// Custom error class for API errors
export class ApiError extends Error {
    statusCode: number; // While not used directly in gRPC, good for consistency
    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

// Global error handler for gRPC methods would be different, but this serves for internal service errors.
// For gRPC, you typically return a gRPC status code and details in the callback.
export const handleServiceError = (error: any, context: string): { code: number; details: string } => {
    if (error instanceof ApiError) {
        Logger.error(`[${context}] API Error: ${error.statusCode} - ${error.message}`, context);
        return { code: error.statusCode >= 500 ? 13 : 3, details: error.message }; // INTERNAL or INVALID_ARGUMENT
    } else {
        Logger.error(`[${context}] Unhandled Error: ${error.message || 'Unknown error'}\n${error.stack}`, context);
        return { code: 2, details: 'An internal server error occurred.' }; // UNKNOWN
    }
};

interface ResponseData {
  [key: string]: any;
}

export const responseHandler = {
 errorHandle: (res: Response, error: unknown) => {
    let message = 'Something went wrong!';
    let statusCode = 500; // Default status code for unknown errors

    // Type narrowing: Check if error is an instance of Error
    if (error instanceof Error) {
      message = error.message || message;
      statusCode = 400; // You can set different status codes based on error type
    } else if (error instanceof AppError) {
      message = error.message;
      statusCode = error.statusCode;
    }

    // In production, log the error (ensure this is not exposed in response)
    if (process.env.NODE_ENV === 'production') {
      console.error(error);
    }

    return res.status(statusCode).json({
      code: 'ERROR',
      status: 'Failure',
      message,
    });
  },

  successHandle: async (res: Response, data: ResponseData = {}) => {
    return res.status(CONSTANTS.SUCCESS).json({
      code: CONSTANTS.SUCCESS,
      status: CONSTANTS.SUCCESS_S,
      data,
    });
  }
};
