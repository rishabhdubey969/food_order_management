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

export const GetOrdersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get orders with filters, sorting, and pagination' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'startDate',
      type: String,
      required: false,
      description: 'Start date for filtering orders by creation date (ISO format)',
      example: '2025-06-01',
    }),
    ApiQuery({
      name: 'endDate',
      type: String,
      required: false,
      description: 'End date for filtering orders by creation date (ISO format)',
      example: '2025-06-30',
    }),
    ApiQuery({
      name: 'status',
      type: String,
      required: false,
      description: 'Filter orders by status (e.g., preparing, delivered)',
      example: 'preparing',
    }),
    ApiQuery({
      name: 'paymentStatus',
      type: String,
      required: false,
      description: 'Filter orders by payment status (e.g., pending, completed)',
      example: 'pending',
    }),
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search by userId, restaurantId, or paymentMethod',
      example: '683d3571a0fe3b4852019ff',
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by',
      example: 'createdAt',
      enum: ['createdAt', 'updatedAt', 'subtotal', 'tax', 'total', 'timestamp', 'status'],
    }),
    ApiQuery({
      name: 'sortOrder',
      type: String,
      required: false,
      description: 'Sort order',
      example: 'desc',
      enum: ['asc', 'desc'],
    }),
    ApiQuery({
      name: 'page',
      type: Number,
      required: false,
      description: 'Page number for pagination',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      type: Number,
      required: false,
      description: 'Number of orders per page',
      example: 10,
    }),
    ApiResponse({ status: 200, description: 'Successfully retrieved orders' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );