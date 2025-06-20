import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

export const GetAllUsersSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Get a paginated list of managers' }),
  ApiBearerAuth('JWT'),
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
  ApiResponse({ status: 200, description: 'Successfully retrieved managers list' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
  ApiResponse({ status: 400, description: 'Bad Request - Invalid pagination parameters' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const BlockUserSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Block a user by ID' }),
  ApiBearerAuth('JWT'),
  ApiParam({
    name: 'id',
    type: String,
    description: 'User ID to block',
    example: '12345',

  }),
  ApiResponse({ status: 200, description: 'User successfully blocked' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID' }),
  ApiResponse({ status: 404, description: 'User not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);
export const GetUserByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a user by ID' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'userId',
      type: String,
      required: true,
      description: 'ID of the user to retrieve',
      example: '6582a8b59636531038ce',
    }),
    ApiResponse({ status: 200, description: 'Successfully retrieved user' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
export const GetUsersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get users with filters, sorting, and pagination' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'startDate',
      type: String,
      required: false,
      description: 'Start date for filtering users by creation date (ISO format)',
      example: '2025-06-01',
    }),
    ApiQuery({
      name: 'endDate',
      type: String,
      required: false,
      description: 'End date for filtering users by creation date (ISO format)',
      example: '2025-06-30',
    }),
    ApiQuery({
      name: 'is_active',
      type: Boolean,
      required: false,
      description: 'Filter users by active status',
      example: true,
    }),
  
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search by email',
      example: 'john@example.com',
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by',
      example: 'createdAt',
      enum: ['createdAt', 'email', 'is_active'],
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
      description: 'Number of users per page',
      example: 10,
    }),
    ApiResponse({ status: 200, description: 'Successfully retrieved users' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );