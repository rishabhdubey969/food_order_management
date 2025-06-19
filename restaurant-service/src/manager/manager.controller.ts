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
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './modules/auth/guards/jwtauthguard';
import { Types } from 'mongoose';
import { OrderHandoverDto } from './modules/auth/dto/orderHandOver.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ForgotPasswordDto, ResetPasswordDto } from './modules/auth/dto/reset.password.dto';

@ApiTags('Manager')
@ApiBearerAuth('access-token')

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**Register a manager
   * 
   * @param managerSignupDto 
   * @returns 
   */
  @Post('signup')
  @ApiOperation({ summary: 'Signup as a Manager' })
  @ApiBody({ type: ManagerSignupDto })
  @ApiResponse({ status: 201, description: 'Manager signed up successfully' })
  signup(@Body() managerSignupDto: ManagerSignupDto) {
    return this.managerService.Signup(managerSignupDto);
  }
  
  /**Login a manager
   * 
   * @param managerLoginDto The manager's login credentials (username and password)
   * @returns An object containing access token and refresh token
   */
  @Post('login')
  @ApiOperation({ summary: 'Login as a Manager' })
  @ApiBody({ type: ManagerLoginDto })
  @ApiResponse({ status: 200, description: 'Manager logged in successfully' })
  login(@Body() managerLoginDto: ManagerLoginDto) {
    return this.managerService.login(managerLoginDto);
  }

  /**forgot-password sends a link manager mail
   * 
   * @param forgotPasswordDto 
   * @returns 
   */
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.managerService.initiatePasswordReset(forgotPasswordDto.email);
  }
  
  
  /**
   * resetPassword of a manager
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.managerService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  /**
   * Logout a manager
   */
@UseGuards(JwtAuthGuard)
 @Post('logout')
@ApiOperation({ summary: 'Logout Manager (JWT verified)' })
@ApiResponse({ status: 200, description: 'Manager logged out successfully' })
logout(@Headers('authorization') authHeader: string) {
  const token = authHeader?.split(' ')[1];
  return this.managerService.logout(token);
}

   /**
   * Get a manger by it's id
   */
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
  
  /**
   * update a manager by it's id
   */
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
  
  /**
   * Handling whether the order is available 
   */
  @EventPattern('isFoodAvailable')
  async handleIsFoodAvailable(@Payload('cartId', ParseObjectIdPipe) cartId: Types.ObjectId){ 
    console.log("hii");
    return await this.managerService.handleIsFoodAvailable(cartId);
  }
  
  /**
   * When the order is handovered to the delivery boy
   */
@Post('orderHandOver')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT') 
@ApiOperation({ summary: 'Mark order as handed over' })
@ApiBody({
  description: 'Order ID to mark as handed over',
  schema: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'MongoDB ObjectId of the order',
        example: '507f1f77bcf86cd799439011'
      }
    },
    required: ['orderId']
  }
})
async handleOrderhandover(@Body('orderId', ParseObjectIdPipe) orderId: Types.ObjectId ) {
  return this.managerService.handleOrderHandover(orderId);
}
}
