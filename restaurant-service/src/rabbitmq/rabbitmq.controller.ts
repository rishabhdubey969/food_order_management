import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CreateRabbitmqDto } from './dto/create-rabbitmq.dto';
import { UpdateRabbitmqDto } from './dto/update-rabbitmq.dto';

@Controller('rabbitmq')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  
}
