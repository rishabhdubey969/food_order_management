import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose'; // Assuming you're using Mongoose

@Injectable()
export class MongoIdValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ID format: "${value}". Must be a valid MongoDB ObjectId.`);
    }
    return value;
  }
}