import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { GetSignUpReques, GetSignUpRespons } from '../manager/manager.controller';

export const GetAllManagersSwagger = () => applyDecorators(
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

export const BlockManagerAndRestaurantSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Block a restaurant' }),
  ApiBearerAuth('JWT'),
  ApiQuery({
    name: 'managerId',
    type: String,
    required: true,
    description: 'ID of the manager to block',
    example: '67890',
  }),
  ApiResponse({ status: 200, description: 'managervsuccessfully blocked' }),
  ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid managerId' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'manager not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);
export const GetRestaurantsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get restaurants with filters, sorting, and pagination' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'startDate',
      type: String,
      required: false,
      description: 'Start date for filtering restaurants by creation date (ISO format)',
      example: '2025-06-01',
    }),
    ApiQuery({
      name: 'endDate',
      type: String,
      required: false,
      description: 'End date for filtering restaurants by creation date (ISO format)',
      example: '2025-06-30',
    }),
    ApiQuery({
      name: 'is_active',
      type: Boolean,
      required: false,
      description: 'Filter restaurants by active status',
      example: true,
    }),
    ApiQuery({
      name: 'isBlocked',
      type: Boolean,
      required: false,
      description: 'Filter restaurants by blocked status',
      example: false,
    }),
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search by name or description',
      example: 'Great Eatery',
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by',
      example: 'createdAt',
      enum: ['createdAt', 'name', 'is_active', 'blocked'],
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
      description: 'Number of restaurants per page',
      example: 10,
    }),
    ApiResponse({ status: 200, description: 'Successfully retrieved restaurants' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
  export const GetManagersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get managers with filters, sorting, and pagination' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'startDate',
      type: String,
      required: false,
      description: 'Start date for filtering managers by creation date (ISO format)',
      example: '2025-06-01T00:00:00.000Z',
    }),
    ApiQuery({
      name: 'endDate',
      type: String,
      required: false,
      description: 'End date for filtering managers by creation date (ISO format)',
      example: '2025-06-30T23:59:59.999Z',
    }),
  
    ApiQuery({
      name: 'isblocked',
      type: Boolean,
      required: false,
      description: 'Filter managers by blocked status',
      example: false,
    }),
    ApiQuery({
      name: 'isActiveManager',
      type: Boolean,
      required: false,
      description: 'Filter managers by active manager status',
      example: true,
    }),
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search by name or email',
      example: 'yashi',
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by',
      example: 'createdAt',
      enum: ['createdAt', 'name', 'email', 'is_active', 'blocked', 'isActiveManager'],
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
      description: 'Number of managers per page',
      example: 10,
    }),
    ApiResponse({ status: 200, description: 'Successfully retrieved managers' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid parameters' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
export const ValidateManagerSwagger = () => applyDecorators(
  ApiOperation({ summary: 'ValidateManager' }),
  ApiBearerAuth('JWT'),
  ApiQuery({
    name: 'managerId',
    type: String,
    required: true,
    description: 'ID of the manager to validate',
    example: '67890',
  }),
  ApiResponse({ status: 200, description: 'Manager successfully validated' }),
  ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid managerId' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'Manager not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const InValidateManagerSwagger = () => applyDecorators(
  ApiOperation({ summary: 'ValidateManager' }),
  ApiBearerAuth('JWT'),
  ApiQuery({
    name: 'managerId',
    type: String,
    required: true,
    description: 'ID of the manager to Invalidate',
    example: '67890',
  }),
  ApiResponse({ status: 200, description: 'Manager successfully Invalidated' }),
  ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid managerId' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'Manager not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const SoftDeleteManagerAndRestaurantSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Soft delete a manager and their associated restaurant' }),
  ApiBearerAuth('JWT'),
  ApiParam({
    name: 'restaurantId',
    type: String,
    required: true,
    description: 'ID of the restaurant to soft delete',
    example: '67890',
  }),
  ApiResponse({ status: 200, description: 'Manager and restaurant successfully soft deleted' }),
  ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid managerId or restaurantId' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'Manager or restaurant not found' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const SignupSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Sign up a new manager' }),
  ApiBody({ type: GetSignUpReques, description: 'User signup data' }),
  ApiResponse({ status: 201, description: 'User successfully created', type: GetSignUpRespons }),
  ApiResponse({ status: 400, description: 'Bad Request - Invalid or missing signup data' }),
  ApiResponse({ status: 409, description: 'Conflict - User with this email already exists' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);