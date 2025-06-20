import { PartialType } from '@nestjs/swagger';
import { CreateComplainDto } from './create-complain.dto';

export class UpdateComplainDto extends PartialType(CreateComplainDto) {}
