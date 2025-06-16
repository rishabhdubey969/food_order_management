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
    name: 'restaurantId',
    type: String,
    required: true,
    description: 'ID of the restaurant to block',
    example: '67890',
  }),
  ApiResponse({ status: 200, description: 'Restaurant successfully blocked' }),
  ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid restaurantId' }),
  ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' }),
  ApiResponse({ status: 404, description: 'Restaurant not found' }),
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