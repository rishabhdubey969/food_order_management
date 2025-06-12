import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @EventPattern('send_email')
  // async handleSendEmail(@Payload() data: { to: string; subject: string; html: string }) {
  //   console.log(data);
  //   await this.adminService.sendAdminEmail(data);
  // }
}