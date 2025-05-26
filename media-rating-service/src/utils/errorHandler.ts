// src/utils/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class for structured error responses.
 */
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, ApiError.prototype); // Maintain proper prototype chain
    }
}

/**
 * Global error handling middleware for Express.
 * It catches errors thrown by controllers and services, formats them, and sends a consistent response.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Default to 500 Internal Server Error if not an ApiError
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err instanceof ApiError ? err.message : 'An unexpected error occurred.';

    // Log the error for debugging purposes (in a real app, use a proper logger like Winston or Pino)
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (!(err instanceof ApiError) || !err.isOperational) {
        console.error(err.stack); // Log stack trace for non-operational or unexpected errors
    }

    // Send a standardized error response
    res.status(statusCode).json({
        status: 'error',
        message: message,
        // In production, you might want to hide the stack trace
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

/**
 * Wrapper for async Express route handlers to catch errors and pass them to the error middleware.
 * @param fn The async function (controller method) to wrap.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };