import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, isValidObjectId } from 'mongoose';
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
import { WinstonLogger } from 'src/logger/winston-logger.service';

@Injectable()
export class ManagerService {
  orderService: any;
  constructor(
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    @InjectConnection() private readonly connection: Connection,
    private readonly tokenService: TokenService,
    private readonly managerGateway: ManagerGateway,
    private readonly kafkaService: KafkaService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    private readonly logger: WinstonLogger,
  ) {}

  async Signup(managerSignupDto: ManagerSignupDto) {
    try {
      const { email, password } = managerSignupDto;

      if (!email || !password) {
        this.logger.warn('Signup failed: Missing email or password');
        throw new BadRequestException(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
      }

      const existingManager = await this.managerModel.findOne({ email });
      if (existingManager) {
        this.logger.warn(`Signup failed: Manager already exists with email ${email}`);
        throw new BadRequestException(ERROR_MESSAGES.MANAGER_ALREADY_EXISTS);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newManager = new this.managerModel({
        ...managerSignupDto,
        password: hashedPassword,
      });

      const savedManager = await newManager.save();
      this.client.emit('user_created', savedManager);

      this.logger.log(`Manager signed up successfully: ${email}`);

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
      this.logger.error(`Signup failed for ${managerSignupDto.email}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(ERROR_MESSAGES.REGISTRATION_FAILED);
    }
  }

  async login(managerLoginDto: ManagerLoginDto) {
    try {
      const { email, password } = managerLoginDto;

      if (!email || !password) {
        this.logger.warn('Login failed: Missing email or password');
        throw new BadRequestException(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
      }

      const manager = await this.managerModel.findOne({ email });
      if (!manager) {
        this.logger.warn(`Login failed: No manager found with email ${email}`);
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await bcrypt.compare(password, manager.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for email ${email}`);
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const payload = { sub: manager._id, email: manager.email, role: 'manager' };
      const accessToken = this.tokenService.signAccessToken(payload);
      const refreshToken = this.tokenService.signRefreshToken(payload);

      this.logger.log(`Manager logged in successfully: ${email}`);

      return {
        message: SUCCESS_MESSAGES.MANAGER_LOGIN,
        accessToken,
        refreshToken,
        data: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
        },
      };
    } catch (error) {
      this.logger.error(`Login error for ${managerLoginDto.email}`, error.stack);
      throw error;
    }
  }

  async initiatePasswordReset(email: string) {
    try {
      if (!email) {
        this.logger.warn('Password reset initiation failed: Email is required');
        throw new BadRequestException('Email is required');
      }

      const manager = await this.managerModel.findOne({ email });
      if (!manager) {
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return { message: SUCCESS_MESSAGES.RESET_LINK_SENT };
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = addHours(new Date(), 1);
      manager.resetToken = resetToken;
      manager.resetTokenExpiry = resetTokenExpiry;
      await manager.save();

      this.client.emit('reset_link', { email: manager.email, resetToken });
      await this.sendPasswordResetEmail(manager.email, resetToken);

      this.logger.log(`Password reset link generated and emailed to: ${email}`);
      return { message: SUCCESS_MESSAGES.RESET_LINK_SENT };
    } catch (error) {
      this.logger.error(`Password reset initiation failed for ${email}`, error.stack);
      throw new UnauthorizedException(ERROR_MESSAGES.RESET_PASSWORD_FAILED);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      if (!token || !newPassword) {
        this.logger.warn('Reset password failed: Missing token or new password');
        throw new BadRequestException(ERROR_MESSAGES.REQUIRED_FIELDS_EMPTY);
      }

      const manager = await this.managerModel.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      });

      if (!manager) {
        this.logger.warn('Reset password failed: Invalid or expired token');
        throw new BadRequestException(ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }

      manager.password = await bcrypt.hash(newPassword, 10);
      manager.resetToken = undefined;
      manager.resetTokenExpiry = undefined;
      await manager.save();

      await this.sendPasswordChangedConfirmation(manager.email);
      this.logger.log(`Password successfully reset for ${manager.email}`);

      return { message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS };
    } catch (error) {
      this.logger.error('Password reset failed', error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new UnauthorizedException(ERROR_MESSAGES.RESET_PASSWORD_FAILED);
    }
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    this.logger.log(`Sending password reset email to ${email}: ${resetLink}`);
    this.client.emit('password_reset_requested', { email, resetLink, subject: 'Password Reset Request' });
  }

  private async sendPasswordChangedConfirmation(email: string) {
    this.logger.log(`Sending password changed confirmation to ${email}`);
    this.client.emit('password_changed', { email, subject: 'Your Password Has Been Changed' });
  }

  async logout(token: string) {
    try {
      await this.tokenService.verifyToken(token, 'access');
      this.logger.log('Manager logged out successfully');
      return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  async getManagerById(id: string) {
    try {
      const manager = await this.managerModel.findById(id);
      if (!manager) {
        this.logger.warn(`Get manager failed: Manager not found with ID ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }

      this.logger.log(`Manager fetched successfully: ${id}`);
      return {
        message: SUCCESS_MESSAGES.MANAGER_FOUND,
        data: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch manager by ID: ${id}`, error.stack);
      throw error;
    }
  }

  async updateManager(id: string, updateManagerDto: Partial<ManagerSignupDto>) {
    try {
      const updatedManager = await this.managerModel.findByIdAndUpdate(id, updateManagerDto, { new: true });
      if (!updatedManager) {
        this.logger.warn(`Update manager failed: No manager with ID ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.MANAGER_NOT_FOUND);
      }

      this.logger.log(`Manager updated successfully: ${id}`);
      return {
        message: SUCCESS_MESSAGES.MANAGER_UPDATED,
        data: updatedManager,
      };
    } catch (error) {
      this.logger.error(`Failed to update manager ID: ${id}`, error.stack);
      throw error;
    }
  }

  async handleIsFoodAvailable(cartId: ObjectId) {
    try {
      if (!cartId || !isValidObjectId(cartId)) {
        this.logger.warn('Invalid cart ID');
        throw new BadRequestException('Invalid cart ID');
      }

      const cartData = await this.connection.collection('carts').findOne({ _id: cartId });
      if (!cartData) {
        this.logger.warn(`Cart not found: ${cartId}`);
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }

      const restaurantId = cartData.restaurantId;
      if (!restaurantId) {
        this.logger.warn('Cart missing restaurant ID');
        throw new BadRequestException('Cart has no associated restaurant');
      }

      const manager = await this.managerModel.findOne({ restaurantId }, { _id: 1 }).exec();
      if (!manager) {
        this.logger.warn(`No manager found for restaurant: ${restaurantId}`);
        throw new NotFoundException(`No manager found for restaurant ${restaurantId}`);
      }

      this.logger.log(`New order processed for manager: ${manager._id}`);
      return await this.managerGateway.handleNewOrder(manager._id, cartData);
    } catch (error) {
      this.logger.error(`Error processing cart ${cartId}`, error.stack);
      throw new InternalServerErrorException('Failed to process new order');
    }
  }

  async processOrderDecision(orderId: string, decision: 'accept' | 'reject') {
    try {
      const result =
        decision === 'accept'
          ? await this.orderService.acceptOrder(orderId)
          : await this.orderService.rejectOrder(orderId);

      this.logger.log(`Order ${decision}ed successfully: ${orderId}`);
      return {
        message: `Order ${decision}ed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to ${decision} order ID: ${orderId}`, error.stack);
      throw new InternalServerErrorException(`Failed to ${decision} order`);
    }
  }

  async handleOrderHandover(orderId: Types.ObjectId) {
    try {
      await this.kafkaService.handleEvent('handOvered', { orderId });
      this.logger.log(`Order handover event sent for order ID: ${orderId}`);
      return { message: 'Notification sent to everyone successfully' };
    } catch (error) {
      this.logger.error(`Order handover failed for order ID: ${orderId}`, error.stack);
      throw new InternalServerErrorException('Failed to send handover notification');
    }
  }
}




