import { Controller, Get, Post, Body, Param, Delete, ValidationPipe, UsePipes, UseGuards, Put } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('address')
@ApiBearerAuth()
@Controller('address')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * Create a new address for the authenticated user.
   * @param createAddressDto Data for creating a new address
   */
  @Post()
  @ApiOperation({ summary: 'Create a new address for the authenticated user' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.addressCreateService(createAddressDto);
  }

  /**
   * Get all addresses for the authenticated user.
   */
  @Get()
  @ApiOperation({ summary: 'Get all addresses for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user addresses' })
  async findAll() {
    return this.addressService.getUserAddressService();
  }

  /**
   * Get a specific address by its ID.
   * @param id Address ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific address by its ID' })
  @ApiParam({ name: 'id', type: String, description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address details' })
  async findOne(@Param('id') id: string) {
    return this.addressService.findOneAddressService(id);
  }

  /**
   * Update an existing address by its ID.
   * @param id Address ID
   * @param updateAddressDto Data for updating the address
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing address by its ID' })
  @ApiParam({ name: 'id', type: String, description: 'Address ID' })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.updateAddressService(id, updateAddressDto);
  }

  /**
   * Delete an address by its ID.
   * @param id Address ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address by its ID' })
  @ApiParam({ name: 'id', type: String, description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.addressService.deleteAddressService(id);
  }
}
