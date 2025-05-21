import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ListUsersDto } from './dto/list-users.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Query() listUsersDto: ListUsersDto) {
    return this.userService.findAll(listUsersDto);
  }
}