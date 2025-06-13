// src/config/error-handler.ts
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class ErrorHandler {
  static handleError(error: any, customMessage?: string): never {
    console.error('Error occurred:', error);

    if (error instanceof BadRequestException) {
      throw new BadRequestException(error.message || customMessage || 'Bad request');
    }
    if (error instanceof NotFoundException) {
      throw new NotFoundException(error.message || customMessage || 'Resource not found');
    }
    if (error instanceof UnauthorizedException) {
      throw new UnauthorizedException(error.message || customMessage || 'Unauthorized');
    }

    // Map specific error messages
    if (error.message === 'Invalid credentials') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (error.code === 11000) {
      throw new BadRequestException('Duplicate key error: resource already exists');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new BadRequestException('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestException('Token has expired');
    }
    if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
      throw new InternalServerErrorException('Failed to send email');
    }

    throw new InternalServerErrorException(
      customMessage || 'An unexpected error occurred',
    );
  }
}