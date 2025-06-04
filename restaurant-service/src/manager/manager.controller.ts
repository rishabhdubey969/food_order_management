import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Inject,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import ManagerLoginDto from 'src/manager/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/dto/managerSignuodto';
import { ManagerService } from './manager.service';
import { GrpcMethod } from '@nestjs/microservices';

@ApiTags('Manager')
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Signup as a Manager' })
  @ApiBody({ type: ManagerSignupDto })
  @ApiResponse({ status: 201, description: 'Manager signed up successfully' })
  signup(@Body() managerSignupDto: ManagerSignupDto) {
    return this.managerService.signup(managerSignupDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login as a Manager' })
  @ApiBody({ type: ManagerLoginDto })
  @ApiResponse({ status: 200, description: 'Manager logged in successfully' })
  login(@Body() managerLoginDto: ManagerLoginDto) {
    return this.managerService.login(managerLoginDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get Manager by ID' })
  @ApiQuery({ name: 'id', required: true, description: 'Manager ID' })
  @ApiResponse({ status: 200, description: 'Manager details fetched successfully' })
  getManagerById(@Query('id') id: string) {
    return this.managerService.getManagerById(id);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Update Manager Details' })
  @ApiParam({ name: 'id', required: true, description: 'Manager ID' })
  @ApiBody({ type: ManagerSignupDto, description: 'Fields to update (partial allowed)' })
  @ApiResponse({ status: 200, description: 'Manager updated successfully' })
  updateManager(@Param('id') id: string, @Body() updateData: Partial<ManagerSignupDto>) {
    return this.managerService.updateManager(id, updateData);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete Manager by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Manager ID' })
  @ApiResponse({ status: 200, description: 'Manager deleted successfully' })
  deleteManager(@Param('id') id: string) {
    return this.managerService.deleteManager(id);
  }

  @GrpcMethod('managerService', 'GetKitchenStatus')
  async getKitchenStatus(data: { cartId: string }): Promise<{ kitchenStatus: boolean }> {
    const result = await this.managerService.fetchKitchenStatus(data.cartId);
    return { kitchenStatus: result };
  }
}
