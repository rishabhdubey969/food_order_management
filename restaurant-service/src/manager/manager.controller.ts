import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import ManagerLoginDto from 'src/manager/modules/auth/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/modules/auth/dto/managerSignuodto';
import { ManagerService } from './manager.service';
import {GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './modules/auth/guards/jwtauthguard';
import { Types } from 'mongoose';
import { OrderHandoverDto } from './modules/auth/dto/orderHandOver.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

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
  @ApiBearerAuth('JWT')
  @Get("/:id")
  @ApiOperation({ summary: 'Get Manager by ID' })
  // @ApiQuery({ name: 'id', required: true, description: 'Manager ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Manager details fetched successfully' })
  getManagerById(@Param('id') id: string) {
    console.log(id);
    return this.managerService.getManagerById(id);
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
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
<<<<<<< HEAD
  
@Post('orderHandOver')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT') 
@ApiOperation({ summary: 'Mark order as handed over' })
@ApiBody({
  description: 'Order ID to mark as handed over',
=======

  @ApiOperation({ summary: 'Update Manager Details' })
  @ApiBody({
>>>>>>> da0102099fccedc956909c111cf885973ba66200
  schema: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
<<<<<<< HEAD
        description: 'MongoDB ObjectId of the order',
        example: '507f1f77bcf86cd799439011'
      }
    },
    required: ['orderId']
=======
        example: '664a12ef3ff8cdbe0246823e',
      },
    },
    required: ['orderId'],
  },
})
  @Post('orderHandOver')
  async handleOrderhandover(@Body('orderId') orderId: Types.ObjectId){
    await this.managerService.handleOrderHandover(orderId);
    return {
      success: true,
      message: "Order HandOvered Accepted"
    }
>>>>>>> da0102099fccedc956909c111cf885973ba66200
  }
})
async handleOrderhandover(@Body('orderId', ParseObjectIdPipe) orderId: Types.ObjectId ) {
  return this.managerService.handleOrderHandover(orderId);
}
}
