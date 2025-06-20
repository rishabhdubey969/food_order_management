import { Controller, Get, Param, Patch, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetAllUsersSwagger, BlockUserSwagger, GetUsersSwagger, GetUserByIdSwagger } from '../swagger/user.swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
@UseGuards(AdminGuard)
  @Get('list')
  @GetAllUsersSwagger()
  async getAllUsers(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.userService.getAllUsers(token, pageNum, limitNum);
  }
  @UseGuards(AdminGuard)
  @Get(':userId')
  @GetUserByIdSwagger()
  async getUserById(@Request() req, @Query('userId') userId: string) {
   
    return this.userService.getUserById(req.userId, userId);
  }
  @UseGuards(AdminGuard)
@Get()
  @GetUsersSwagger()
  async getUsers(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('is_active') isActive?: boolean,
    
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.userService.getUsers(token ,req.userId, {
      startDate,
      endDate,
      isActive,
    
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }
  @UseGuards(AdminGuard)
  @Patch('block/:id')
  @BlockUserSwagger()
  async blockUser(@Param('id') userId: string) {
    return this.userService.blockUser(userId);
  }

  @UseGuards(AdminGuard)
  @Patch('unblock/:id')
  async unblockUser(@Param('id') userId: string) {
    return this.userService.unblockUser(userId);
  }
}