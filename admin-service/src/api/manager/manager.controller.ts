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
  SignupSwagger,InValidateManagerSwagger,ValidateManagerSwagger,
  GetRestaurantsSwagger,
  GetManagersSwagger
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
  @Get('managers')
  @GetManagersSwagger()
  async getManagers(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  
    @Query('isblocked') isblocked?: boolean,
    @Query('isActiveManager') isActiveManager?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
   
    return this.managerService.getManagers(req.managerId, {
      startDate,
      endDate,
    
      isblocked,
      isActiveManager,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }
  @Get('restaurants')
  @GetRestaurantsSwagger()
  async getRestaurants(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('is_active') isActive?: boolean,
    @Query('isBlocked') isBlocked?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
   
    return this.managerService.getRestaurants(req.restaurantId, {
      startDate,
      endDate,
      isActive,
      isBlocked,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }
  

  @UseGuards(AdminGuard)
  @Patch('block')
  @BlockManagerAndRestaurantSwagger()
  async blockManagerAndRestaurant(
    @Query('managerId') managerId: string,
  ) {
    if (!managerId) {
      throw new Error('managerId and restaurantId are required');
    }
 const result = await this.managerService.blockManagerAndRestaurant(managerId);
  return { success: result }
    
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

    const result =  await this.managerService.ValidateManager(managerId);
  return { success: result }
   
    
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
const result = await this.managerService.InValidateManager(managerId)
  return { success: result }
   
  }

  @UseGuards(AdminGuard)
  @Delete(':managerId')
  @SoftDeleteManagerAndRestaurantSwagger()
  async softDeleteManagerAndRestaurant(
    @Param('managerId') managerId: string,
  ) {
   const result = await this.managerService.softDeleteManagerAndRestaurant(managerId);
  return { success: result }; 
 
        
      
    
  }

  // @Post('signup')
  // @SignupSwagger()
  // async signup(@Body() data: GetSignUpRequest): Promise<GetSignUpResponse> {
  //   return this.managerService.signup(data);
  // }
}