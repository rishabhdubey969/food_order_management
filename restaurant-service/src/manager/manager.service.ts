import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {Connection, Model, Types ,isValidObjectId} from 'mongoose';
import * as bcrypt from 'bcrypt';
import ManagerLoginDto from 'src/manager/modules/auth/dto/managerLogindto';
import ManagerSignupDto from 'src/manager/modules/auth/dto/managerSignuodto';
import { Manager } from './schema/manager.schema';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from 'src/manager/constants/errorand success';
import { TokenService } from 'src/manager/modules/token/token.service';
import { ManagerGateway } from 'src/manager/modules/gateway/manager.gateway';
import { ObjectId } from 'mongodb';
import { KafkaService } from './kafka/kafka.service';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';

@Injectable()
export class ManagerService  {
  private readonly logger = new Logger(ManagerService.name);
  cartService: any;
  orderService: any;

  constructor(
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly managerGateway: ManagerGateway,
    private readonly kafkaService: KafkaService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  async Signup(managerSignupDto: ManagerSignupDto) {
  try {
    const { email, password } = managerSignupDto;
    
    if (!email || !password) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
    }

    const existingManager = await this.managerModel.findOne({ email });
    if (existingManager) {
      throw new BadRequestException(ERROR_MESSAGES.MANAGER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new this.managerModel({
      ...managerSignupDto,
      password: hashedPassword
    });

    const savedManager = await newManager.save();
     this.client.emit('user_created', savedManager);
    return {
      message: SUCCESS_MESSAGES.MANAGER_SIGNUP,
      data: {
        id: savedManager._id,
        name: savedManager.name,
        email: savedManager.email,
        accountNumber: savedManager.accountNumber,
        ifscCode: savedManager.ifscCode,
        bankName: savedManager.bankName,
      },
    };
  } catch (error) {
    this.logger.error('Signup failed', error.stack);
    
    if (error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException(ERROR_MESSAGES.REGISTRATION_FAILED);
  }
}
  async login(managerLoginDto: ManagerLoginDto) {
    const { email, password } = managerLoginDto;

    if (!email || !password) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
    }

    const manager = await this.managerModel.findOne({ email });
    if (!manager) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const payload = {
      sub: manager._id,
      email: manager.email,
      role: 'manager',
    };

    const token = this.tokenService.sign(payload);

    return {
      message: SUCCESS_MESSAGES.MANAGER_LOGIN,
      token,
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      },
    };
  }

  async initiatePasswordReset(email: string): Promise<{ message: string }> {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const manager = await this.managerModel.findOne({ email });
      if (!manager) {
        // For security reasons, we return a success message even if email doesn't exist
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return { message: SUCCESS_MESSAGES.RESET_LINK_SENT };
      }

      // Generate a reset token and expiry (1 hour from now)
      const resetToken = uuidv4();
      const resetTokenExpiry = addHours(new Date(), 1);

      manager.resetToken = resetToken;
      manager.resetTokenExpiry = resetTokenExpiry;
      await manager.save();
     const mailData = {
  email: manager.email,
  resetToken 
};
this.client.emit('reset_link', mailData);

      // Send email with reset link 
      await this.sendPasswordResetEmail(manager.email, resetToken);

      return { message: SUCCESS_MESSAGES.RESET_LINK_SENT };
    } catch (error) {
      this.logger.error('Password reset initiation failed', error.stack);
      throw new UnauthorizedException(ERROR_MESSAGES.RESET_PASSWORD_FAILED);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      if (!token || !newPassword) {
        throw new BadRequestException(ERROR_MESSAGES.REQUIRED_FIELDS_EMPTY);
      }

      const manager = await this.managerModel.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      });

      if (!manager) {
        throw new BadRequestException(ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }

      // Update password and clear reset token
      manager.password = await bcrypt.hash(newPassword, 10);
      manager.resetToken = undefined;
      manager.resetTokenExpiry = undefined;
      await manager.save();

      // Optionally send confirmation email
      await this.sendPasswordChangedConfirmation(manager.email);

      return { message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS };
    } catch (error) {
      this.logger.error('Password reset failed', error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(ERROR_MESSAGES.RESET_PASSWORD_FAILED);
    }
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Implement your email sending logic here
    // This is a placeholder - you'll need to integrate with your email service
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    this.logger.log(`Password reset link for ${email}: ${resetLink}`);
    
    // Example using your notification service
    this.client.emit('password_reset_requested', { 
      email,
      resetLink,
      subject: 'Password Reset Request'
    });
  }

  private async sendPasswordChangedConfirmation(email: string): Promise<void> {
    // Implement your email sending logic here
    this.client.emit('password_changed', { 
      email,
      subject: 'Your Password Has Been Changed'
    });
  }

  async logout(token: string) {
    try {
      await this.tokenService.verify(token);
      // this.tokenService.blacklistToken(token);

      return {
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      };
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  async getManagerById(id: string) {
    try {
      const manager = await this.managerModel.findById(id);
      if (!manager) {
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }

      return {
        message: SUCCESS_MESSAGES.MANAGER_FOUND,
        data: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch manager with ID: ${id}`, error.stack);
      throw error;
    }
  }
  async updateManager(id: string, updateManagerDto: Partial<ManagerSignupDto>) {
    try {
      const updatedManager = await this.managerModel.findByIdAndUpdate(
        {
          _id: id,
          ...updateManagerDto,
        }
      );
      if (!updatedManager) {
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }
      return {
        message: SUCCESS_MESSAGES.MANAGER_UPDATED,
        data: updatedManager,
      };
    } catch (error) {
      this.logger.error(`Failed to update manager with ID: ${id}`, error.stack);
      throw error;
    }
  }
   async handleIsFoodAvailable(cartId: ObjectId): Promise<any> {
  try {
    if (!cartId || !isValidObjectId(cartId)) {
      throw new BadRequestException('Invalid cart ID');
    }
    const cartData = await this.connection.collection('carts').findOne({_id: cartId});
    if (!cartData) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }
    const restaurantId = cartData.restaurantId;
    if (!restaurantId) {
      throw new BadRequestException('Cart has no associated restaurant');
    }
    const manager = await this.managerModel.findOne(
      { restaurantId: restaurantId }, 
      { _id: 1 }
    ).exec();
    
    if (!manager) {
      throw new NotFoundException(`No manager found for restaurant ${restaurantId}`);
    }

    return await this.managerGateway.handleNewOrder(manager._id, cartData);
  } catch (error) {
    this.logger.error(`Error handling new order for cart ${cartId}, error.stack`);
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Failed to process new order');
  }
}

  async processOrderDecision(orderId: string, decision: 'accept' | 'reject') {
    try {
      const result =
        decision === 'accept'
          ? await this.orderService.acceptOrder(orderId)
          : await this.orderService.rejectOrder(orderId);

      return {
        message: `Order ${decision}ed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to ${decision} order with ID: ${orderId}`, error.stack);
      throw new InternalServerErrorException(`Failed to ${decision} order`);
    }
  }
 
  async handleOrderHandover(orderId: Types.ObjectId){
    await this.kafkaService.handleEvent('handOvered', {orderId: orderId})
    return {message: 'Notification send to Everyone Successfully!!'}
  }
}