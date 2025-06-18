import { PartialType } from '@nestjs/swagger';
import { CreateRabbitmqDto } from './create-rabbitmq.dto';

export class UpdateRabbitmqDto extends PartialType(CreateRabbitmqDto) {}
