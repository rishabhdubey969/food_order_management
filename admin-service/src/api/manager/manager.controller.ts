import {Controller,Get,Param,Patch,Query,UseGuards,Request,Body,Post,Delete,HttpException, HttpStatus,} from '@nestjs/common';
import {GetSignUpRequest,GetSignUpResponse} from './interface/interface';

import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ManagerService } from './manager.service';


export class GetSignUpReques {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Password of the user', example: 'password123' })
  password: string;

  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  name: string;
}


export class GetSignUpRespons {
  @ApiProperty({ description: 'ID of the created user', example: '12345' })
  id: string;

  @ApiProperty({
    description: 'Message indicating signup success',
    example: 'User created successfully',
  })
  message: string;
}

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @UseGuards(AdminGuard)
  @Get('list')
  @ApiOperation({ summary: 'Get a paginated list of managers' }) 
  @ApiBearerAuth('JWT')
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
    description: 'Page number (default: 1)',
    example: '1',
  }) 
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
    description: 'Items per page (default: 10, max: 100)',
    example: '10',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved managers list',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }) 
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid pagination parameters',
  }) 
  @ApiResponse({ status: 500, description: 'Internal Server Error' }) 
  async getAllManagers(@Request() req, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    console.log('IN manager controller');
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token: ', token);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return await this.managerService.getAllManagers(token, pageNum, limitNum);
  }

  @UseGuards(AdminGuard)
  @Patch('block')
  @ApiOperation({ summary: 'Block a restaurant' })
  @ApiBearerAuth('JWT')
  @ApiQuery({
    name: 'restaurantId',
    type: String,
    required: true,
    description: 'ID of the restaurant to block',
    example: '67890',
  })
  @ApiResponse({ status: 200, description: 'Restaurant successfully blocked' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or invalid restaurantId',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token, or non-admin role',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async blockManagerAndRestaurant(
    @Query('restaurantId') restaurantId: string,
   
  ) {
    if (!restaurantId) {
      throw new Error('managerId and restaurantId are required');
    }

    return this.managerService.blockRestaurant(restaurantId);
  }

  @UseGuards(AdminGuard)
  @Delete(':restaurantId')
  @ApiOperation({
    summary: 'Soft delete a manager and their associated restaurant',
  })
  @ApiBearerAuth('JWT') 
  @ApiParam({
    name: 'restaurantId',
    type: String,
    required: true,
    description: 'ID of the restaurant to soft delete',
    example: '67890',
  })
  @ApiResponse({
    status: 200,
    description: 'Manager and restaurant successfully soft deleted',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or invalid managerId or restaurantId',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token, or non-admin role',
  })
  @ApiResponse({ status: 404, description: 'Manager or restaurant not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async softDeleteManagerAndRestaurant(@Param('restaurantId') restaurantId: string) {
    try {
      const result = await this.managerService.softDeleteRestaurant(restaurantId);
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

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new manager' })
  @ApiBody({ type: GetSignUpReques, description: 'User signup data' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: GetSignUpRespons,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing signup data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this email already exists',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async signup(@Body() data: GetSignUpRequest): Promise<GetSignUpResponse> {
    return this.managerService.signup(data);
  }
}
