import { Controller, Get, Headers, Param, Patch, Query, UnauthorizedException, UseGuards,Request } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
   @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Get a paginated list of managers' }) // Description of the endpoint
    @ApiQuery({ name: 'page', type: String, required: false, description: 'Page number (default: 1)', example: '1' }) // Documents the page query parameter
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Items per page (default: 10, max: 100)', example: '10' }) // Documents the limit query parameter
    @ApiResponse({ status: 200, description: 'Successfully retrieved managers list' }) // Success response
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }) // Unauthorized response
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid pagination parameters' }) // Bad request response
    @ApiResponse({ status: 500, description: 'Internal Server Error' }) // Server error response

  async getAllUsers(
    //  @ApiBearerAuth('Authorization')
      @Request() req,
    // @Headers('authorization') authHeader: string,
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
  @ApiOperation({ summary: 'Block a user by ID' })
  @ApiBearerAuth('JWT') // Indicates Bearer token is required
  @ApiParam({ name: 'id', type: String, description: 'User ID to block', example: '12345' })
  @ApiResponse({ status: 200, description: 'User successfully blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async blockUser(@Param('id') userId: string) {
    return this.userService.blockUser(userId);
  }

  @UseGuards(AdminGuard)
  @Patch('unblock/:id')
  async unblockUser(@Param('id') userId: string) {
    return this.userService.unblockUser(userId);
  }
}


