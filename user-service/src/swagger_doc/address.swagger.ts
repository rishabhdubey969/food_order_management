import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { CreateAddressDto } from 'src/api/address/dto/create-address.dto';
import { UpdateAddressDto } from 'src/api/address/dto/update-address.dto';

export function CreateAddressDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new address for a user',
      description:
        'This endpoint creates a new address record for a user. It requires valid input based on the `CreateAddressDto` schema.',
    }),
    ApiBody({
      description: 'Address data to be created',
      type: CreateAddressDto,
      examples: {
        success: {
          value: {
            street: '123 Main St',
            city: 'New York',
            postal_code: 10001,
            country: 'USA',
          },
        },
        error: {
          value: {
            street: '',
            city: '',
            postal_code: '',
            country: '',
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'User address created successfully', type: CreateAddressDto }),
    ApiResponse({
      status: 400,
      description: 'Invalid input. Ensure all required fields are filled correctly.',
      schema: { type: 'object', properties: { message: { type: 'string' }, statusCode: { type: 'number' } } },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiBearerAuth(),
  );
}

export function GetAddressAllDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all addresses for the authenticated user',
      description: 'This endpoint retrieves all addresses associated with the authenticated user.',
    }),
    ApiResponse({
      status: 200,
      description: 'List of addresses for the authenticated user',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            street: { type: 'string' },
            city: { type: 'string' },
            postal_code: { type: 'number' },
            country: { type: 'string' },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'No addresses found for the authenticated user' }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiBearerAuth(),
  );
}

export function GetAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a specific address by its ID',
      description: 'This endpoint retrieves a single address by its unique ID.',
    }),
    ApiParam({ name: 'id', description: 'ID of the address to retrieve', required: true, type: 'number' }),
    ApiResponse({
      status: 200,
      description: 'Address found successfully',
      type: CreateAddressDto,
    }),
    ApiResponse({ status: 404, description: 'Address not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiBearerAuth(),
  );
}

export function UpdateAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an existing address by its ID',
      description: 'This endpoint allows you to update an address record by its unique ID.',
    }),
    ApiParam({ name: 'id', description: 'ID of the address to update', required: true, type: 'number' }),
    ApiBody({
      description: 'Updated address information',
      type: UpdateAddressDto,
      examples: {
        success: {
          value: {
            street: '456 New St',
            city: 'Los Angeles',
            postal_code: 90001,
            country: 'USA',
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Address updated successfully', type: CreateAddressDto }),
    ApiResponse({ status: 400, description: 'Invalid input provided for updating address' }),
    ApiResponse({ status: 404, description: 'Address not found or could not be updated' }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiBearerAuth(),
  );
}

export function DeleteAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an address by its ID',
      description: 'This endpoint deletes an address record identified by its ID.',
    }),
    ApiParam({ name: 'id', description: 'ID of the address to delete', required: true, type: 'number' }),
    ApiResponse({ status: 200, description: 'Address deleted successfully' }),
    ApiResponse({ status: 404, description: 'Address not found or already deleted' }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiBearerAuth(),
  );
}
