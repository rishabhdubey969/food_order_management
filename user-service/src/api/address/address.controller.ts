import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addressCreate(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.addressCreateService(createAddressDto);
  }

  @Get()
  getUserAddresses() {
    return this.addressService.getUserAddressService();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.update(+id, updateAddressDto);
  }

  @Delete(':id')
  deleteAddress(@Param('id') id: string) {
    return this.addressService.deleteAddressService(id);
  }
}
