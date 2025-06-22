import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateComplainDto } from './dto/create-complain.dto';
import { Complain, ComplainDocument } from './entities/complain.entity';
import { InjectModel } from '@nestjs/mongoose';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Model } from 'mongoose';

@Injectable()
export class ComplainService {
  constructor(
    @InjectModel(Complain.name)
    private complainModel: Model<ComplainDocument>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  /**
   * This method is used to handle user complaints.
   * @param createComplainDto - The data transfer object containing complaint details.
   * @returns A string indicating the action taken.
   */
  async userComplainService(createComplainDto: CreateComplainDto, sub: any) {
    this.logger.log('info', 'User complaint service called');
    const orderCheck = await this.complainModel.findOne({
      orderId: createComplainDto.orderId,
    });
    if (orderCheck) throw new BadRequestException('complain is already exists, with this order');
    const result = {
      userId: sub,
      ...createComplainDto,
    };
    const response = new this.complainModel(result);
    const saved = await response.save();
    return { message: 'User complaint created successfully', data: saved };
  }
}
