import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Put,
  Delete,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import ManagerLoginDto from 'src/manager/modules/auth/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/modules/auth/dto/managerSignuodto';
import { ManagerService } from './manager.service';
import { EventPattern, GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { Roles } from 'src/manager/common/roles.decorator';
import { AdminGuard } from 'src/manager/modules/auth/guards/admin.guard';
import { JwtAuthGuard } from './modules/auth/guards/authguard';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';

@ApiTags('Manager')
@ApiBearerAuth('access-token')

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  
  @Post('signup')
  @ApiOperation({ summary: 'Signup as a Manager' })
  @ApiBody({ type: ManagerSignupDto })
  @ApiResponse({ status: 201, description: 'Manager signed up successfully' })
  signup(@Body() managerSignupDto: ManagerSignupDto) {
    return this.managerService.Signup(managerSignupDto);
  }
  
 
  @Post('login')
  @ApiOperation({ summary: 'Login as a Manager' })
  @ApiBody({ type: ManagerLoginDto })
  @ApiResponse({ status: 200, description: 'Manager logged in successfully' })
  login(@Body() managerLoginDto: ManagerLoginDto) {
    return this.managerService.login(managerLoginDto);
  }
@UseGuards(JwtAuthGuard)
 @Post('logout')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Logout Manager (JWT verified)' })
@ApiResponse({ status: 200, description: 'Manager logged out successfully' })
logout(@Headers('authorization') authHeader: string) {
  const token = authHeader?.split(' ')[1];
  return this.managerService.logout(token);
}

   @UseGuards(JwtAuthGuard)
     @Get("/:id")
  @ApiOperation({ summary: 'Get Manager by ID' })
  @ApiQuery({ name: 'id', required: true, description: 'Manager ID' })
  @ApiResponse({ status: 200, description: 'Manager details fetched successfully' })
  getManagerById(@Param('id') id: string) {
    console.log(id);
    return this.managerService.getManagerById(id);
  }
  
  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  @ApiOperation({ summary: 'Update Manager Details' })
  @ApiParam({ name: 'id', required: true, description: 'Manager ID' })
  @ApiBody({ type: ManagerSignupDto, description: 'Fields to update (partial allowed)' })
  @ApiResponse({ status: 200, description: 'Manager updated successfully' })
  updateManager(@Param('id') id: string, @Body() updateData: Partial<ManagerSignupDto>) {
    return this.managerService.updateManager(id, updateData);
  }
   @GrpcMethod('ManagerService', 'SignupManager')
  async signupManager(data: ManagerSignupDto) {
    return this.managerService.Signup(data);
  }
  
  @MessagePattern('isFoodAvailable')
  async handleIsFoodAvailable(@Payload() cartId: Types.ObjectId){ 
    return await this.managerService.handleIsFoodAvailable(cartId);
  }

  @Post('orderHandOver')
  async handleOrderhandover(@Body('orderId') orderId: Types.ObjectId){
    await this.managerService.handleOrderHandover(orderId);
  }
}
