import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { CreateAddressDto } from 'src/api/address/dto/create-address.dto'
import { UpdateAddressDto } from 'src/api/address/dto/update-address.dto'

export function CreateAddressDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new address' }),
    ApiBody({ type: CreateAddressDto }),
    ApiResponse({ status: 201, description: 'User address created successfully', type: CreateAddressDto }),
    ApiResponse({ status: 400, description: 'Invalid input' }),
    ApiBearerAuth(),
  );
}

export function GetAddressAllDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all address ' }),
    ApiResponse({ status: 200, description: 'User address found' }),
    ApiResponse({ status: 404, description: 'User address not found' }),
    ApiBearerAuth(),
  );
}


export function GetAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a specific address by its ID ' }),
    ApiParam({ name: 'id', type: String, description: 'Address ID' }),
    ApiResponse({ status: 200, description: 'User address found' }),
    ApiResponse({ status: 404, description: 'User address not found' }),
    ApiBearerAuth(),
  );
}

export function UpdateAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing address by its ID ' }),
    ApiParam({ name: 'id', type: String, description: 'Address ID' }),
    ApiBody({ type: UpdateAddressDto }),
    ApiResponse({ status: 200, description: 'User address updated successfully' }),
    ApiResponse({ status: 404, description: 'User address not updated successfully' }),
    ApiBearerAuth(),
  );
}


export function DeleteAddressByIdDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an address by its ID' }),
    ApiParam({ name: 'id', type: String, description: 'Address ID' }),
    ApiResponse({ status: 200, description: 'Address deleted successfully' }),
    ApiResponse({ status: 404, description: 'Address deleted not successfully' }),
    ApiBearerAuth(),
  );
}
