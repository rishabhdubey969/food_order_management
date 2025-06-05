import { Controller, Get, Headers, Param, Patch, Query, UnauthorizedException, UseGuards ,Request} from '@nestjs/common';
import { ManagerService } from './manager.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

 @Get('list')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get a paginated list of managers' }) // Description of the endpoint
  @ApiQuery({ name: 'page', type: String, required: false, description: 'Page number (default: 1)', example: '1' }) // Documents the page query parameter
  @ApiQuery({ name: 'limit', type: String, required: false, description: 'Items per page (default: 10, max: 100)', example: '10' }) // Documents the limit query parameter
  @ApiResponse({ status: 200, description: 'Successfully retrieved managers list' }) // Success response
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' }) // Unauthorized response
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid pagination parameters' }) // Bad request response
  @ApiResponse({ status: 500, description: 'Internal Server Error' }) // Server error response
  async getAllManagers(
    // @Headers('authorization') authHeader: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.managerService.getAllManagers(token, pageNum, limitNum);
  }

  
  @UseGuards(AdminGuard)
  @Patch('block')
  @ApiOperation({ summary: 'Block a manager and their associated restaurant' })
  @ApiBearerAuth('JWT') // Indicates Bearer token is required
  @ApiQuery({ name: 'managerId', type: String, required: true, description: 'ID of the manager to block', example: '12345' })
  @ApiQuery({ name: 'restaurantId', type: String, required: true, description: 'ID of the restaurant to block', example: '67890' })
  @ApiResponse({ status: 200, description: 'Manager and restaurant successfully blocked' })
  @ApiResponse({ status: 400, description: 'Bad Request - Missing or invalid managerId or restaurantId' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token, or non-admin role' })
  @ApiResponse({ status: 404, description: 'Manager or restaurant not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async blockManagerAndRestaurant(
    @Query('managerId') managerId: string,
    @Query('restaurantId') restaurantId: string,
    //@Request() req,
  ) {
    if (!managerId || !restaurantId) {
      throw new Error('managerId and restaurantId are required');
    }
  
    return this.managerService.blockManagerAndRestaurant(managerId, restaurantId);
  }

  @UseGuards(AdminGuard)
  @Patch('unblock')
  async unblockManagerAndRestaurant(
    @Query('managerId') managerId: string,
    @Query('restaurantId') restaurantId: string,
    @Request() req,
  ) {
    if (!managerId || !restaurantId) {
      throw new Error('managerId and restaurantId are required');
    }
    const adminId = req.user.sub;
    return this.managerService.unblockManagerAndRestaurant(managerId, restaurantId, adminId);
  }
}