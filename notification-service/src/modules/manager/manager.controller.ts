import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

   @EventPattern('complaint_notification')
   async handleComplainStatus(@Payload() data: any) {
    return await this.managerService.handleComplainStatusService(data);
   }
}
