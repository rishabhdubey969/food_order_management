import {
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  UseGuards,
  Request,
  Body,
  Post,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  // GetSignUpRequest,
  // GetSignUpResponse,
  ManagerService,
} from './manager.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import {
  GetAllManagersSwagger,
  BlockManagerAndRestaurantSwagger,
  SoftDeleteManagerAndRestaurantSwagger,
  SignupSwagger,InValidateManagerSwagger,ValidateManagerSwagger
} from '../swagger/manager.swagger';

export class GetSignUpReques {
  email: string;
  password: string;
  name: string;
}

export class GetSignUpRespons {
  id: string;
  message: string;
}

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @UseGuards(AdminGuard)
  @Get('list')
  @GetAllManagersSwagger()
  async getAllManagers(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
 
    const token = req.headers.authorization?.split(' ')[1];

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return await this.managerService.getAllManagers(token, pageNum, limitNum);
  }

  @UseGuards(AdminGuard)
  @Patch('block')
  @BlockManagerAndRestaurantSwagger()
  async blockManagerAndRestaurant(
    @Query('restaurantId') restaurantId: string,
  ) {
    if (!restaurantId) {
      throw new Error('managerId and restaurantId are required');
    }

    return this.managerService.blockRestaurant(restaurantId);
  } 
  
  @UseGuards(AdminGuard)
  @Patch('Validate')
  @ValidateManagerSwagger()
  async ValidateManager(
    @Query('managerId') managerId: string,
  ) {
    if (!managerId) {
      throw new Error('managerId is required');
    }

    return this.managerService.ValidateManager(managerId);
  } 
  
  
  @UseGuards(AdminGuard)
  @Patch('Invalidate')
  @InValidateManagerSwagger()
  async InValidateManage(
    @Query('managerId') managerId: string,
  ) {
    if (!managerId) {
      throw new Error('managerId is required');
    }

    return this.managerService.InValidateManager(managerId);
  }

  @UseGuards(AdminGuard)
  @Delete(':restaurantId')
  @SoftDeleteManagerAndRestaurantSwagger()
  async softDeleteManagerAndRestaurant(
    @Param('restaurantId') restaurantId: string,
  ) {
    try {
      const result =
        await this.managerService.softDeleteRestaurant(restaurantId);
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to soft delete manager and restaurant',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Post('signup')
  // @SignupSwagger()
  // async signup(@Body() data: GetSignUpRequest): Promise<GetSignUpResponse> {
  //   return this.managerService.signup(data);
  // }
}