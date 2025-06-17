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