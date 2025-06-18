import { ConflictException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address, AddressDocument } from './entities/address.entity';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ADDRESS, WINSTON_LOGGER_ADDRESS } from 'constants/address.const';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  /**
   * Creates a new address for a user if it does not already exist.
   *
   * Checks if an address with the same user ID, latitude, and longitude already exists.
   * If such an address exists, throws a ConflictException.
   * Otherwise, creates and saves the new address using the provided data.
   *
   * @param createAddressDto - Data Transfer Object containing address details to be created.
   * @throws {ConflictException} If the address already exists for the user.
   * @returns The newly created address document.
   */
  async addressCreateService(createAddressDto: CreateAddressDto, userId: string) {
    this.logger.info(`${WINSTON_LOGGER_ADDRESS.ADDRESS_CREATE}: ${createAddressDto}`);
    const exists = await this.addressModel.findOne({
      user_id: userId,
      latitude: createAddressDto.latitude,
      longitude: createAddressDto.longitude,
    });

    const fullAddressDto = {...createAddressDto, user_id: userId };

    if (exists) {
      throw new ConflictException(ADDRESS.ADDRESS_EXIST);
    }
    const createdAddress = new this.addressModel(fullAddressDto);
    return await createdAddress.save();
  }

  /**
   * Get address data
   * @returns get address data fetch from address collection
   */
  async getUserAddressService() {
    return await this.addressModel.find().exec();
  }

  /**
   * Retrieves a single address document by its unique identifier.
   *
   * @param id - The unique identifier of the address to retrieve.
   * @returns A promise that resolves to the address document(s) matching the provided ID.
   */
  async findOneAddressService(id: string) {
    return await this.addressModel.find({ _id: id }).exec();
  }

  /**
   * Updates an existing address document by its ID with the provided update data.
   *
   * @param id - The unique identifier of the address to update.
   * @param updateAddressDto - The data transfer object containing the fields to update.
   * @returns A promise that resolves to the updated address document.
   * @throws {HttpException} If the address ID is not provided or the update operation fails.
   */
  async updateAddressService(id: string, updateAddressDto: UpdateAddressDto) {
    if (!id) throw new HttpException(ADDRESS.ID_NOT_FOUND, HttpStatus.FORBIDDEN);

    const updatedAddress = await this.addressModel
      .findOneAndUpdate(
        { _id: id }, // Find the profile by userId
        { $set: updateAddressDto }, // Update with the data from UpdateProfileDto
        { new: true }, // Return the updated document
      )
      .exec();

    if (!updatedAddress) {
      this.logger.error(`${WINSTON_LOGGER_ADDRESS.ADDRESS_UPDATE_FAILED}: ${id}`);
      throw new HttpException(ADDRESS.ADDRESS_UPDATE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return updatedAddress;
  }

  /**
   * Deletes an address by its ID.
   *
   * Logs the deletion attempt, validates the provided ID, and attempts to delete the address
   * from the database. Throws an HttpException if the ID is not provided or if the address
   * is not found. Returns a success message and the deleted address data upon successful deletion.
   *
   * @param id - The unique identifier of the address to delete.
   * @returns An object containing a success message and the deleted address data.
   * @throws {HttpException} If the address ID is not provided or the address is not found.
   */
  async deleteAddressService(id: string) {
    this.logger.info(`${WINSTON_LOGGER_ADDRESS.DELETE_ADDRESS}: ${id}`);
    if (!id) throw new HttpException(ADDRESS.ID_NOT_FOUND, HttpStatus.FORBIDDEN);

    const deletedData = await this.addressModel.findByIdAndDelete(id);
    if (!deletedData) throw new HttpException(ADDRESS.NOT_FOUND, HttpStatus.FORBIDDEN);

    return { message: ADDRESS.DELETE_SUCCESS, data: deletedData };
  }
}
