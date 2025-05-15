import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address, AddressDocument } from './entities/address.entity';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AddressService {

  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async addressCreateService(createAddressDto: CreateAddressDto) {

     const exists = await this.addressModel.findOne({
      user_id: createAddressDto.user_id,
      latitude: createAddressDto.latitude,
      longitude: createAddressDto.longitude,
    });

    if (exists) {
      throw new ConflictException('This address already exists for the user');
    }
    const createdAddress = new this.addressModel(createAddressDto);
    return await createdAddress.save();
  }

  async getUserAddressService(user_id:string = "681dded5532116f55639eaee") {
    return this.addressModel.find({ user_id }).exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} address`;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  async deleteAddressService(id: string) {
    return await this.addressModel.findByIdAndDelete(id);
  }
}
