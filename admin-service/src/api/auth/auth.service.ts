import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/ reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;
 @Inject('REDIS_CLIENT') private readonly redisClient: Redis;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    // @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    // @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
    this.redis.on('connect', () => this.logger.log('Connected to Redis'));
    this.redis.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async verifyJwtToken(token: string) {
    try {
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.error(`JWT verification failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }

      try {
        const redisToken = await this.redis.get(`access_token:${payload.sub}:${token}`);
        if (!redisToken) {
          this.logger.warn(`Access token not found in Redis for user: ${payload.sub}`);
          throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
        }
        return payload;
      } catch (error) {
        this.logger.error(`Redis lookup failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      this.logger.error(`JWT verification failed: ${error.message}`, error.stack);
      throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }

async login(loginDto: LoginDto) {
  this.logger.log(`Starting admin login attempt for email: ${loginDto.email}`);
  try {
    const { email, password } = loginDto;
    const deviceId = 'DCD04A41-0726-449B-9867-1773DB5F13E7';

    let admin;
    try {
      admin = await this.connection.collection('admins').findOne(
        { email, role: 0, is_active: true, is_deleted: false },
        { projection: { password: 1, deviceId: 1 } },
      );

      if (!admin) {
        this.logger.warn(`Admin not found for email: ${email}`);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      this.logger.error(`Admin lookup failed: ${error.message}`, error.stack);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    try {
      if (!(await bcrypt.compare(password, admin.password))) {
        this.logger.warn(`Invalid password for email: ${email}`);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      this.logger.error(`Password verification failed: ${error.message}`, error.stack);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
try {
    // Update device ID if different
    if (admin.deviceId !== deviceId) {
      await this.connection.collection('admins').updateOne(
        { _id: admin._id },
        { $set: { deviceId } }
      );
      this.logger.log(`Updated device ID for admin ${email}`);

      this.client.emit('send_email', {
        to: email,
        subject: 'You logged in with a new device',
        html: `<h2>Logged in successfully from device ID: ${deviceId}</h2>`,
      });
      this.logger.log(`New device email event emitted for ${email} with device ID: ${deviceId}`);
    }

    // Generate and save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await this.connection.collection('admins').updateOne(
      { _id: admin._id },
      { $set: { otp, otpExpires } }
    );
    this.logger.log(`Generated and saved OTP for admin ${email}`);

    // Send OTP email
    this.client.emit('send_email', {
      to: email,
      subject: 'Your Admin Login OTP',
      html: `Your OTP for admin login is: <b>${otp}</b>. It expires in 10 minutes.`,
    });
    this.logger.log(`OTP email event emitted for ${email}`);

  } catch (error) {
    // Log specific errors based on operation
    if (error.message.includes('updateOne')) {
      this.logger.error(`Failed to update device ID or OTP: ${error.message}`, error.stack);
    } else if (error.message.includes('send_email')) {
      this.logger.error(`Failed to emit email event: ${error.message}`, error.stack);
    } else {
      this.logger.error(`Admin login failed: ${error.message}`, error.stack);
    }
    
    throw new HttpException('Admin login failed', HttpStatus.INTERNAL_SERVER_ERROR);
  }

    return {
      message: 'OTP sent to your email',
      data: { _id: admin._id.toString(), email: admin.email },
    };
  } catch (error) {
    this.logger.error(`Admin login failed: ${error.message}`, error.stack);
    throw new HttpException(
      error.message || 'Admin login failed',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

 async verifyOtp(verifyOtpDto: VerifyOtpDto) {
  this.logger.log(`Starting OTP verification for admin userId: ${verifyOtpDto.userId}`);
    const { userId, otp, password } = verifyOtpDto;

  try {
    // Find admin with valid OTP
    const admin = await this.connection.collection('admins').findOne(
      {
        _id: new ObjectId(userId),
        otp,
        otpExpires: { $gt: new Date() },
        role: 0,
        is_active: true,
        is_deleted: false,
      },
      { projection: { password: 1, email: 1, name: 1 } }
    );

    if (!admin) {
      this.logger.warn(`Invalid or expired OTP for admin userId: ${userId}`);
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Verify password
    if (!(await bcrypt.compare(password, admin.password))) {
      this.logger.warn(`Invalid password for admin userId: ${userId}`);
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    // Clear OTP
    await this.connection.collection('admins').updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { otp: '', otpExpires: '' } }
    );
    this.logger.log(`Cleared OTP for admin userId: ${userId}`);

    // Generate tokens
    const payload = { sub: admin._id.toString(), email: admin.email, role: 'admin' };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Store access token in Redis
    await this.redis.set(
      `access_token:${admin._id}:${accessToken}`,
      JSON.stringify(payload),
      'EX',
      10 * 60
    );

    // Create session
    await this.connection.collection('sessions').insertOne({
      userId: admin._id,
      role: 'admin',
      refreshToken,
      refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Schedule expiration email
    setTimeout(() => {
      try {
        this.client.emit('send_email', {
          to: admin.email,
          subject: 'Your Admin Session is About to Expire',
          html: `
            <h2>Session Expiration Warning</h2>
            <p>Your admin session will expire in 2 minutes.</p>
            <p>Please log in again or use your refresh token to continue accessing the admin panel.</p>
            <p><a href="http://localhost:3000/auth/login">Log in here</a></p>
          `,
        });
        this.logger.log(`Token expiration reminder email event emitted for ${admin.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to emit token expiration email event for ${admin.email}: ${emailError.message}`,
          emailError.stack
        );
      }
    }, 8 * 60 * 1000);

    return {
      data: {
        _id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: 'admin',
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    // Handle specific errors
    if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.UNAUTHORIZED) {
      throw error; // Re-throw BAD_REQUEST and UNAUTHORIZED errors as-is
    }

    // Log specific errors based on operation
    if (error.message.includes('updateOne')) {
      this.logger.error(`Failed to clear OTP: ${error.message}`, error.stack);
    } else if (error.message.includes('redis')) {
      this.logger.error(`Redis store failed: ${error.message}`, error.stack);
    } else if (error.message.includes('insertOne')) {
      this.logger.error(`Session creation failed: ${error.message}`, error.stack);
    } else {
      this.logger.error(`OTP verification failed: ${error.message}`, error.stack);
    }

    throw new HttpException(
      error.message || 'OTP verification failed',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  async refreshToken(refreshToken: string) {
    this.logger.log(`Starting refresh token process`);
    try {
      let payload;
      try {
        payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
      } catch (error) {
        this.logger.error(`Refresh token verification failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
      }

      try {
        const session = await this.connection.collection("sessions")
          .findOne({
            userId: payload.sub,
            refreshToken,
            refreshTokenExpires: { $gt: new Date() },
          })
         
        if (!session) {
          this.logger.warn(`Invalid or expired refresh token for user: ${payload.sub}`);
          throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
        }
      } catch (error) {
        this.logger.error(`Session lookup failed: ${error.message}`, error.stack);
        throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
      }

      try {
        const newAccessToken = this.jwtService.sign(
          { sub: payload.sub, email: payload.email, role: 'admin' },
          { expiresIn: '10m' },
        );

        try {
          await this.redis.set(
            `access_token:${payload.sub}:${newAccessToken}`,
            JSON.stringify(payload),
            'EX',
            10 * 60,
          );
        } catch (error) {
          this.logger.error(`Redis store failed: ${error.message}`, error.stack);
          throw new HttpException('Failed to refresh token', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
          setTimeout(() => {
            try {
              this.client.emit('send_email', {
                to: payload.email,
                subject: 'Your Admin Session is About to Expire',
                html: `
                  <h2>Session Expiration Warning</h2>
                  <p>Your admin session will expire in 2 minutes.</p>
                  <p>Please log in again or use your refresh token to continue accessing the admin panel.</p>
                  <p><a href="http://localhost:3000/auth/login">Log in here</a></p>
                `,
              });
              this.logger.log(`Token expiration reminder email event emitted for ${payload.email}`);
            } catch (emailError) {
              this.logger.error(
                `Failed to emit token expiration email event for ${payload.email}: ${emailError.message}`,
                emailError.stack,
              );
            }
          }, 8 * 60 * 1000);
        } catch (error) {
          this.logger.error(`Failed to schedule expiration email event: ${error.message}`, error.stack);
        }

        return {
          data: {
            accessToken: newAccessToken,
            refreshToken,
          },
        };
      } catch (error) {
        this.logger.error(`Access token generation failed: ${error.message}`, error.stack);
        throw new HttpException('Failed to refresh token', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to refresh token',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: string) {
    this.logger.log(`Starting logout for admin userId: ${userId}`);
    try {
    // Find admin
    const admin = await this.connection.collection("admins").findOne({
      _id: new ObjectId(userId),
      role: 0,
      is_active: true,
      is_deleted: false
    });

    if (!admin) {
      this.logger.warn(`Admin not found for userId: ${userId}`);
      throw new HttpException('Invalid user ID', HttpStatus.NOT_FOUND);
    }

    // Delete sessions and Redis keys
    await this.connection.collection("sessions").deleteMany({ userId });
    const keys = await this.redis.keys(`access_token:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }

    this.logger.log(`Successfully logged out admin userId: ${userId}`);
    return { message: 'Logged out successfully' };

  } catch (error) {
    // Handle specific errors
    if (error.status === HttpStatus.NOT_FOUND) {
      throw error; // Re-throw NOT_FOUND error as-is
    }

    // Log specific errors based on operation
    if (error.message.includes('findOne')) {
      this.logger.error(`Admin lookup failed: ${error.message}`, error.stack);
    } else if (error.message.includes('deleteMany') || error.message.includes('redis')) {
      this.logger.error(`Session deletion failed: ${error.message}`, error.stack);
    } else {
      this.logger.error(`Admin logout failed: ${error.message}`, error.stack);
    }

    throw new HttpException(
      error.message || 'Admin logout failed',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  }



  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Starting forgot password for admin email: ${forgotPasswordDto.email}`);
    try {
      const { email } = forgotPasswordDto;

      let admin;
      try {
        admin = await this.connection.collection("admins").findOne({ email, role: 0, is_active: true });
        if (!admin) {
          this.logger.warn(`Admin not found for email: ${email}`);
          throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
      } catch (error) {
        this.logger.error(`Admin lookup failed: ${error.message}`, error.stack);
        throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
      }

      let resetToken;
      try {
        // Check Redis for an existing reset token
        const redisKey = `reset:${admin._id}`;
        const existingToken = await this.redisClient.get(redisKey);

        if (existingToken) {
          this.logger.log(`Reusing existing reset token from Redis for email: ${email}`);
          resetToken = existingToken;

          // Update MongoDB to ensure consistency
          const updateResult = await this.connection.collection("admins").updateOne(
            { _id: admin._id },
            { $set: { resetToken, resetTokenExpires: new Date(Date.now() + 3600000) } },
          );
          if (updateResult.matchedCount === 0) {
            this.logger.error(`Failed to update admin with reset token: No matching document found`);
            throw new HttpException('Admin forgot password failed', HttpStatus.INTERNAL_SERVER_ERROR);
          }
        } else {
          // Check MongoDB for an unexpired token (optional, for consistency)
          if (admin.resetToken && admin.resetTokenExpires > new Date()) {
            this.logger.log(`Reusing existing reset token from MongoDB for email: ${email}`);
            resetToken = admin.resetToken;
          } else {
            // Generate a new token
            resetToken = this.jwtService.sign(
              { sub: admin._id, email: admin.email },
              { expiresIn: '1h' },
            );
            // Update MongoDB
            const updateResult = await this.connection.collection("admins").updateOne(
              { _id: admin._id },
              { $set: { resetToken, resetTokenExpires: new Date(Date.now() + 3600000) } },
            );
            if (updateResult.matchedCount === 0) {
              this.logger.error(`Failed to update admin with reset token: No matching document found`);
              throw new HttpException('Admin forgot password failed', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            this.logger.log(`Generated reset token for email: ${email}, token: ${resetToken.slice(0, 10)}...`);
          }

          // Store the token in Redis with a TTL of 1 hour (3600 seconds)
          await this.redisClient.set(redisKey, resetToken, 'EX', 3600);
          this.logger.log(`Stored reset token in Redis with key: ${redisKey}`);
        }
      } catch (error) {
        this.logger.error(`Reset token generation or Redis operation failed: ${error.message}`, error.stack);
        throw new HttpException('Admin forgot password failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
        this.client.emit('send_email', {
          to: email,
          subject: 'Admin Password Reset Request',
          html: `Click <a href="${resetUrl}">here</a> to reset your admin password. Link expires in 1 hour.`,
        });
        this.logger.log(`Password reset email event emitted for ${email}`);
        return { message: 'Password reset email sent' };
      } catch (error) {
        this.logger.error(`Failed to emit reset email event: ${error.message}`, error.stack);
        throw new HttpException('Admin forgot password failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Admin forgot password failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

async resetPassword(resetPasswordDto: ResetPasswordDto) {
  this.logger.log(`Starting admin password reset`);
    const { token, newPassword } = resetPasswordDto;

  try {
    // Step 1: Verify the token and extract the payload
    const payload = this.jwtService.verify(token);
    if (!payload.sub) {
      this.logger.warn(`Token payload missing 'sub' field`);
      throw new HttpException('Invalid reset token', HttpStatus.BAD_REQUEST);
    }
    const adminId = payload.sub;

    // Step 2: Check the token in Redis
    const redisKey = `reset:${adminId}`;
    const storedToken = await this.redisClient.get(redisKey);
    if (!storedToken || storedToken !== token) {
      this.logger.warn(`Reset token not found or mismatched in Redis for admin ID: ${adminId}`);
      throw new HttpException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    // Step 3: Find the admin in MongoDB and validate the token
    const admin = await this.connection.collection("admins").findOne({
      _id: new ObjectId(adminId),
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
      role: 0,
      is_active: true,
      is_deleted: false,
    });
    if (!admin) {
      this.logger.warn(`Invalid or expired reset token for admin ID: ${adminId}`);
      throw new HttpException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    // Step 4: Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 5: Update the admin's password in MongoDB and clear the reset token
    const updateResult = await this.connection.collection("admins").updateOne(
      { _id: new ObjectId(adminId) },
      { $set: { password: hashedPassword }, $unset: { resetToken: "", resetTokenExpires: "" } }
    );
    if (updateResult.matchedCount === 0) {
      this.logger.error(`Failed to update admin password: No matching document found for admin ID: ${adminId}`);
      throw new HttpException('Admin password reset failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Step 6: Delete the token from Redis (non-critical, so no error throw)
    try {
      await this.redisClient.del(redisKey);
      this.logger.log(`Deleted reset token from Redis for admin ID: ${adminId}`);
    } catch (redisError) {
      this.logger.error(`Failed to delete reset token from Redis: ${redisError.message}`, redisError.stack);
    }

    this.logger.log(`Password reset successful for admin ID: ${adminId}`);
    return { message: 'Password reset successful' };

  } catch (error) {
    // Handle specific errors
    if (error.status === HttpStatus.BAD_REQUEST) {
      throw error; // Re-throw BAD_REQUEST errors as-is
    }

    // Log specific errors based on operation
    if (error.message.includes('verify')) {
      this.logger.error(`Token verification failed: ${error.message}`, error.stack);
      throw new HttpException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    } else if (error.message.includes('redis')) {
      this.logger.error(`Redis operation failed: ${error.message}`, error.stack);
      throw new HttpException('Failed to validate reset token', HttpStatus.INTERNAL_SERVER_ERROR);
    } else if (error.message.includes('findOne')) {
      this.logger.error(`Admin lookup failed: ${error.message}`, error.stack);
      throw new HttpException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    } else if (error.message.includes('bcrypt')) {
      this.logger.error(`Password hashing failed: ${error.message}`, error.stack);
    } else if (error.message.includes('updateOne')) {
      this.logger.error(`Failed to update admin password: ${error.message}`, error.stack);
    } else {
      this.logger.error(`Admin password reset failed: ${error.message}`, error.stack);
    }

    throw new HttpException(
      error.message || 'Admin password reset failed',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

}