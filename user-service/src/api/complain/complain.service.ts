import { Injectable } from '@nestjs/common';
import { CreateComplainDto } from './dto/create-complain.dto';
import { UpdateComplainDto } from './dto/update-complain.dto';

@Injectable()
export class ComplainService {
  create(createComplainDto: CreateComplainDto) {
    return 'This action adds a new complain';
  }

  findAll() {
    return `This action returns all complain`;
  }

  findOne(id: number) {
    return `This action returns a #${id} complain`;
  }

  update(id: number, updateComplainDto: UpdateComplainDto) {
    return `This action updates a #${id} complain`;
  }

  remove(id: number) {
    return `This action removes a #${id} complain`;
  }
}
