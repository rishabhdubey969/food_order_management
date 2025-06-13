import { Injectable, Logger, HttpException, HttpStatus, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { ClientProxy } from '@nestjs/microservices';
import { ObjectId } from 'mongodb';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    // @InjectModel(User.name) private readonly userModel: Model<User>,
     @InjectConnection() private readonly connection: Connection,
    private readonly authService: AuthService,
     private readonly emailService: EmailService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  async blockUser(userId: string) {
    this.logger.log(`Attempting to block user with ID: ${userId}`);
    try {
      const user = await this.connection.collection('users')
        .findOne({ _id: new ObjectId(userId)})
      
      if (!user) {
        this.logger.warn(`User not found for ID: ${userId}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user.is_active) {
        this.logger.warn(`User with ID: ${userId} is already blocked`);
        throw new HttpException('User is already blocked', HttpStatus.BAD_REQUEST);
      }

      user.is_active = false;
      await user.save();
      this.logger.log(`User with ID: ${userId} has been blocked`);

 let  Subject= 'Your Account Has Been Blocked'
         let text =`<p>Your account has been blocked by an admin. Please contact support for more information.</p>`;
         let email=user.email
          await this.emailService.sendEmail(email, Subject, text);
      // this.client.emit('send_email', {
      //   to: user.email,
      //   subject: 'Your Account Has Been Blocked',
      //   html: `<p>Your account has been blocked by an admin. Please contact support for more information.</p>`,
      // });
      // this.logger.log(`Block notification email emitted for ${user.email}`);

      return { message: `User with ID ${userId} has been blocked` };
    } catch (error) {
      this.logger.error(`Failed to block user with ID: ${userId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to block user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async unblockUser(userId: string) {
    this.logger.log(`Attempting to unblock user with ID: ${userId}`);
    try {
      const user = await this.connection.collection("users")
        .findOne({ _id:new ObjectId( userId)})
      
      if (!user) {
        this.logger.warn(`User not found for ID: ${userId}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.is_active) {
        this.logger.warn(`User with ID: ${userId} is already unblocked`);
        throw new HttpException('User is already unblocked', HttpStatus.BAD_REQUEST);
      }

      user.is_active = true;
      await user.save();
      this.logger.log(`User with ID: ${userId} has been unblocked`);

      // Emit email notification
      try {
        this.client.emit('send_email', {
          to: user.email,
          subject: 'Your Account Has Been Unblocked',
          html: `<p>Your account has been unblocked by an admin. You can now access your account.</p>`,
        });
        this.logger.log(`Unblock notification email emitted for ${user.email}`);
      } catch (error) {
        this.logger.error(`Failed to emit unblock notification email: ${error.message}`, error.stack);
      }
      this.logger.log(`User with ID: ${userId} has been blocked`);
       let  Subject= 'Your Account Has Been Unblocked'
         let text =`<p>Your account has been unblocked by an admin. You can now access your account.</p>`;
         let email=user.email
          await this.emailService.sendEmail(email, Subject, text);
  
      // this.client.emit('send_email', {
      //   to: ,
      //   subject: 'Your Account Has Been Unblocked',
      //   html: `<p>Your account has been unblocked by an admin. You can now access your account.</p>`,
      // });
      this.logger.log(`Unblock notification email emitted for ${user.email}`);

      return { message: `User with ID ${userId} has been unblocked` };
    } catch (error) {
      this.logger.error(`Failed to unblock user with ID: ${userId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to unblock user',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getAllUsers(token: string, page: number = 1, limit: number = 10) {
    this.logger.log(`Fetching list of users with pagination - page: ${page}, limit: ${limit}`);
    try {
      let payload;
      try {
        payload = await this.authService.verifyJwtToken(token);
      } catch (error) {
        this.logger.error(`Token verification failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }

      try {
        if (payload.role !== 'admin') {
          this.logger.warn(`Unauthorized access attempt by role: ${payload.role}`);
          throw new UnauthorizedException('Only admins can access this endpoint');
        }
      } catch (error) {
        this.logger.error(`Role check failed: ${error.message}`, error.stack);
        throw new HttpException(
          error.message || 'Only admins can access this endpoint',
          HttpStatus.UNAUTHORIZED,
        );
      }

      let pageNum, limitNum;
      try {
        pageNum = Math.max(1, page);
        limitNum = Math.max(1, Math.min(limit, 100));
      } catch (error) {
        this.logger.error(`Pagination parameter validation failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid pagination parameters', HttpStatus.BAD_REQUEST);
      }

      const skip = (pageNum - 1) * limitNum;

      let users;
      try {
        users = await this.connection.collection("users")
          .find({ role: 2, is_active: true, is_deleted: false })
           .project({ _id: 1, email: 1, username: 1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();
        
      } catch (error) {
        this.logger.error(`User query failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let total;
      try {
        total = await this.connection.collection("users")
          .countDocuments({ role: 2, is_active: true, is_deleted: false })
          
      } catch (error) {
        this.logger.error(`Count query failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let totalPages;
      try {
        totalPages = Math.ceil(total / limitNum);
      } catch (error) {
        this.logger.error(`Pagination calculation failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        data: users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}