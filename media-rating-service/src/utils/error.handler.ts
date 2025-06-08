// src/utils/error.handler.ts
import { Logger } from './logger';

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