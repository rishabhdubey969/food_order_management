import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import ManagerLoginDto from 'apps/restaurant/src/manager/dto/managerLogin.dto';
import { ManagerService } from './manager.service';
import ManagerSignupDto from 'apps/restaurant/src/manager/dto/managerSignup.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('manager')
export class ManagerController {

    constructor(private readonly managerService: ManagerService) {}

    @Post('signup')
    signup(@Body() managerSignupDto: ManagerSignupDto){
        return this.managerService.signup(managerSignupDto);
    }

    @Post('login')
    login(@Body() managerLoginDto: ManagerLoginDto){
        return this.managerService.login(managerLoginDto);
    }

    @Get()
    getManagerById(@Query('id') id: string) {
        return this.managerService.getManagerById(id);
    }

    @MessagePattern({ cmd: 'approve_manager' })
    approveManager(@Payload() data: { managerId: string }) {
    return this.managerService.activateManager(data.managerId);
    }

}

