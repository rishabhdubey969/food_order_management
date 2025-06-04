import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
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

  async getUserAddressService() {
    return await this.addressModel.find().exec();
  }

  async findOneAddressService(id: string) {
    return await this.addressModel.find({ _id: id }).exec();
  }

  async updateAddressService(id: string, updateAddressDto: UpdateAddressDto) {
    if (!id)
      throw new HttpException('Address Id not found', HttpStatus.FORBIDDEN);

    const updatedAddress = await this.addressModel
      .findOneAndUpdate(
        { _id: id }, // Find the profile by userId
        { $set: updateAddressDto }, // Update with the data from UpdateProfileDto
        { new: true }, // Return the updated document
      )
      .exec();

    if (!updatedAddress) {
      this.logger.error(`Address update failed for id: ${id}`);
      throw new HttpException(
        'Address update failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updatedAddress;
  }

  async deleteAddressService(id: string) {
    this.logger.info(`Deleting address with id: ${id}`);
    if (!id)
      throw new HttpException('Address Id not found', HttpStatus.FORBIDDEN);

    const deletedData = await this.addressModel.findByIdAndDelete(id);
    if (!deletedData)
      throw new HttpException('Address not found', HttpStatus.FORBIDDEN);

    return { message: 'Address deleted successfully', data: deletedData };
  }
}
