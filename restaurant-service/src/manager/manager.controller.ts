import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import ManagerLoginDto from 'src/manager/modules/auth/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/modules/auth/dto/managerSignuodto';
import { ManagerService } from './manager.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './modules/auth/guards/jwtauthguard';
import { Types } from 'mongoose';
import { OrderHandoverDto } from './modules/auth/dto/orderHandOver.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ForgotPasswordDto, ResetPasswordDto } from './modules/auth/dto/reset.password.dto';

@ApiTags('Manager')
@ApiBearerAuth('access-token')

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) { }

  /**Register a new manager account
   * 
   * @param managerSignupDto The manager's registration data including email, password, and other required details
   * @returns Promise containing the created manager profile and authentication tokens
   */
  @Post('signup')
  @ApiOperation({ summary: 'Signup as a Manager' })
  @ApiBody({ type: ManagerSignupDto })
  @ApiResponse({ status: 201, description: 'Manager signed up successfully' })
  async signup(@Body() managerSignupDto: ManagerSignupDto) {
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
  async login(@Body() managerLoginDto: ManagerLoginDto) {
    const res = await this.managerService.login(managerLoginDto); 
    return res;
  }

  /**Initiates password reset process for a manager
   * 
   * @param forgotPasswordDto Contains manager's email address to send reset link
   * @returns Contains manager's email address to send reset link

   */
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.managerService.initiatePasswordReset(forgotPasswordDto.email);
  }

  /** Resets a manager's password using a valid reset token
   * 
   * @param resetPasswordDto Contains reset token, new password, and password confirmation 
   * @returns Promise with success message or error if token is invalid/expired
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.managerService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
  /**Logs out a manager by invalidating their authentication token
   * 
   * @param authHeader - The 'Authorization' header containing the bearer token to invalidate
   * @returns - Promise with success message and cleared cookie headers
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout Manager (JWT verified)' })
  @ApiResponse({ status: 200, description: 'Manager logged out successfully' })
  asynclogout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    return this.managerService.logout(token);
  }
  /**
   * Retrieves a manager's profile by their unique identifier
   * 
   * @param id - The MongoDB ObjectId of the manager to retrieve
   * @returns - Promise containing the manager's profile or NotFoundException
   */

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get("")
  @ApiOperation({ summary: 'Get Manager by ID' })
  @ApiResponse({ status: 200, description: 'Manager details fetched successfully' })
  async getManagerById(@Req() req: any) {
    const id = req.user.sub;
    return this.managerService.getManagerById(id);
  }

  /**
 * Updates a manager's profile information by their unique identifier
 * 
 * @param id - The MongoDB ObjectId of the manager to update
 * @param updateManagerDto - The data to update for the manager
 * @returns - Promise containing the updated manager profile or appropriate error
 */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('update')
  @ApiOperation({ summary: 'Update Manager Details' })
  @ApiBody({ type: ManagerSignupDto, description: 'Fields to update (partial allowed)' })
  @ApiResponse({ status: 200, description: 'Manager updated successfully' })
  async updateManager(@Req() req: any, @Body() updateData: Partial<ManagerSignupDto>) {
    const id = req.user.sub; 
    return this.managerService.updateManager(id, updateData);
  }

  /**
 * Handles real-time order availability verification with manager confirmation
 * 
 * @param managerId - The MongoDB ObjectId of the responsible manager
 * @param cartData - Order details including items, quantities, and special requests
 * @returns Promise<boolean> - True if all items are available and approved by manager, false if unavailable
 * @throws Error - When:
 *   - Manager is not connected (WebSocket offline)
 *   - Manager doesn't respond within timeout period (30s)
 *   - Invalid order data is provided
 * 
 * @emits newOrder - Sends order details to manager via WebSocket
 * @listens orderResponse - Waits for manager's approval decision
 * 
 * @usageNotes
 * This is a critical real-time operation that:
 * 1. Verifies manager is online and connected
 * 2. Sends complete order details for review
 * 3. Enforces a 30-second decision timeout
 * 4. Cleans up listeners after completion
 */
  @EventPattern('isFoodAvailable')
  async handleIsFoodAvailable(@Payload('cartId', ParseObjectIdPipe) cartId: Types.ObjectId) {
    console.log("hii");
    return await this.managerService.handleIsFoodAvailable(cartId);
  }

  /**
 * Handles the order handover process to delivery personnel
 * 
 * @param orderId - The unique identifier of the order being handed over
 * @param deliveryBoyId - The ID of the delivery personnel receiving the order
 * @returns Promise<HandoverReceipt> - Confirmation of successful handover containing:
 *           - orderId
 *           - handoverTimestamp  
 *           - deliveryBoyDetails
 *           - orderStatusUpdate
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
  async handleOrderhandover(@Body('orderId', ParseObjectIdPipe) orderId: Types.ObjectId) {
    return this.managerService.handleOrderHandover(orderId);
  }
}
