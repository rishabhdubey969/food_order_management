import { Controller, Get, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetAllUsersSwagger, BlockUserSwagger } from '../swagger/user.swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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