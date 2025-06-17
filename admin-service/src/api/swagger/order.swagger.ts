import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

export const GetTotalOrdersSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Get total orders for a specific period' }),
  ApiBearerAuth('JWT'),
  ApiQuery({
    name: 'period',
    type: String,
    required: true,
    description: 'Time period for total orders (month, year, week)',
    example: 'month',
    enum: ['month', 'year', 'week'],
  }),
  ApiQuery({
    name: 'status',
    type: String,
    required: false,
    description: 'Filter orders by status (e.g., pending, completed)',
    example: 'completed',
  }),
  ApiQuery({
    name: 'paymentStatus',
    type: String,
    required: false,
    description: 'Filter orders by payment status (e.g., paid, unpaid)',
    example: 'paid',
  }),
  ApiResponse({ status: 200, description: 'Successfully retrieved total orders' }),
  ApiResponse({ status: 400, description: 'Bad Request - Invalid period or parameters' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const GetUserOrdersSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Get orders for a specific user with pagination' }),
  ApiBearerAuth('JWT'),
  ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'ID of the user whose orders are to be retrieved',
    example: '12345',
  }),
  ApiQuery({
    name: 'page',
    type: String,
    required: false,
    description: 'Page number (default: 1)',
    example: '1',
  }),
  ApiQuery({
    name: 'limit',
    type: String,
    required: false,
    description: 'Items per page (default: 10, max: 100)',
    example: '10',
  }),
  ApiResponse({ status: 200, description: 'Successfully retrieved user orders' }),
  ApiResponse({ status: 400, description: 'Bad Request - Invalid pagination parameters or user ID' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'User not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);