import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { UpdateProfileDto } from '../api/profile/dto/update-profile.dto';

export const UpdateProfileSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update user profile',
      description: 'Updates the profile information of an existing user',
    }),
    ApiBearerAuth(),
    ApiBody({ type: UpdateProfileDto }),
    ApiResponse({ 
      status: 200, 
      description: 'Profile updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    ApiResponse({ status: 404, description: 'User profile not found' }),
  );


export const GetProfileSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description: 'Retrieves detailed profile information for a specific user',
    }),
    ApiBearerAuth(),
    ApiResponse({ 
      status: 200, 
      description: 'Profile retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    ApiResponse({ status: 404, description: 'User profile not found' }),
  );

export const DeleteProfileSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete user profile',
      description: 'Deletes a user profile by ID',
    }),
    ApiBearerAuth(),
    ApiResponse({ 
      status: 200, 
      description: 'Profile deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Profile deleted successfully',
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    ApiResponse({ status: 404, description: 'User profile not found' }),
  );
