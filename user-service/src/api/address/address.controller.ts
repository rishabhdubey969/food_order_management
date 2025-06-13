import { Controller, Get, Post, Body, Param, Delete, ValidationPipe, UsePipes, UseGuards, Put } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateAddressDoc, DeleteAddressByIdDoc, GetAddressAllDoc, GetAddressByIdDoc, UpdateAddressByIdDoc } from 'src/doc/address.swagger';

@ApiTags('address')
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
  @CreateAddressDoc()
  async create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.addressCreateService(createAddressDto);
  }

  /**
   * Get all addresses for the authenticated user.
   */
  @Get()
  @GetAddressAllDoc()
  async findAll() {
    return this.addressService.getUserAddressService();
  }

  /**
   * Get a specific address by its ID.
   * @param id Address ID
   */
  @Get(':id')
  @GetAddressByIdDoc()
  async findOne(@Param('id') id: string) {
    return this.addressService.findOneAddressService(id);
  }

  /**
   * Update an existing address by its ID.
   * @param id Address ID
   * @param updateAddressDto Data for updating the address
   */
  @Put(':id')
  @UpdateAddressByIdDoc()
  async update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.updateAddressService(id, updateAddressDto);
  }

  /**
   * Delete an address by its ID.
   * @param id Address ID
   */
  @Delete(':id')
  @DeleteAddressByIdDoc()
  async remove(@Param('id') id: string) {
    return this.addressService.deleteAddressService(id);
  }
}
