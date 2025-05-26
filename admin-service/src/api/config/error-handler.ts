// src/config/error-handler.ts
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class ErrorHandler {
  static handleError(error: any, customMessage?: string): never {
    // Log the error for debugging (you can use a logging service here)
    console.error('Error occurred:', error);

    // Handle specific known exceptions
    if (error instanceof BadRequestException) {
      throw new BadRequestException(error.message || customMessage || 'Bad request');
    }
    if (error instanceof NotFoundException) {
      throw new NotFoundException(error.message || customMessage || 'Resource not found');
    }
    if (error instanceof UnauthorizedException) {
      throw new UnauthorizedException(error.message || customMessage || 'Unauthorized');
    }

    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      throw new BadRequestException('Duplicate key error: resource already exists');
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      throw new BadRequestException('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestException('Token has expired');
    }

    // Handle nodemailer errors
    if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
      throw new InternalServerErrorException('Failed to send email');
    }

    // Fallback for unexpected errors
    throw new InternalServerErrorException(
      customMessage || 'An unexpected error occurred',
    );
  }
}