import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from '../user/entities/user.entity';
import { Manager } from '../user/entities/manager.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/ reset-password.dto';
import { UpdatePasswordDto } from './dto/updatepasssword'; // Fixed typo: 'updatepasssword' to 'update-password'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    private readonly jwtService: JwtService,
  ) {}

  // Register a new user (admin can register users or managers, but admin registration is restricted)
  async register(registerDto: RegisterDto) {
    const { email, password, username, phone, role } = registerDto;

    // Prevent admin registration (admins should be seeded)
    if (role === 'admin') {
      throw new BadRequestException('Admin registration is not allowed');
    }

    // Determine the model based on role
    const isManager = role === 'manager'; // Fixed typo: 'managers' to 'manager'
    const TargetModel = isManager ? this.managerModel : this.userModel;

    // Check if user/manager already exists in the respective collection
    const existingUser = await TargetModel.findOne({ email, is_deleted: false }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user or manager
    const newUser = new TargetModel({
      email,
      password: hashedPassword,
      username,
      phone,
      role: isManager ? 3 : 2, // 2: user, 3: manager
      is_active: true,
      is_deleted: false,
    });

    await newUser.save();

    // Generate JWT
    const payload = { sub: newUser._id, email: newUser.email, role: newUser.role };
    const token = this.jwtService.sign(payload);

    return {
      data: {
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role === 3 ? 'manager' : 'user',
        token,
      },
    };
  }

  // Login for users/managers (admin can use this to log in others)
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Check both collections for the email
    let user = await this.userModel
      .findOne({ email, is_active: true, is_deleted: false })
      .select('+password')
      .exec();

    if (!user) {
      user = await this.managerModel
        .findOne({ email, is_active: true, is_deleted: false })
        .select('+password')
        .exec();
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { sub: user._id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role === 1 ? 'admin' : user.role === 3 ? 'manager' : 'user',
        token,
      },
    };
  }

  // Logout (invalidate token by client-side removal, server can optionally blacklist)
  async logout(userId: string) {
    // In a real app, you might blacklist the token in Redis or a DB
    return { message: 'Logged out successfully' };
  }

  // Forgot Password (send reset link via email)
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check both collections for the email
    let user = await this.userModel.findOne({ email, is_active: true, is_deleted: false }).exec();
    if (!user) {
      user = await this.managerModel.findOne({ email, is_active: true, is_deleted: false }).exec();
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user._id, email: user.email },
      { expiresIn: '1h' },
    );

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.`,
    });

    return { message: 'Password reset email sent' };
  }

  // Reset Password (using reset token)
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check both collections for the user
    let user = await this.userModel
      .findOne({
        _id: payload.sub,
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
        is_active: true,
        is_deleted: false,
      })
      .exec();

    if (!user) {
      user = await this.managerModel
        .findOne({
          _id: payload.sub,
          resetToken: token,
          resetTokenExpires: { $gt: new Date() },
          is_active: true,
          is_deleted: false,
        })
        .exec();
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Update Password (for logged-in users or admin updating for others)
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { oldPassword, newPassword } = updatePasswordDto;

    // Check both collections for the user
    let user = await this.userModel
      .findOne({ _id: userId, is_active: true, is_deleted: false })
      .select('+password')
      .exec();

    if (!user) {
      user = await this.managerModel
        .findOne({ _id: userId, is_active: true, is_deleted: false })
        .select('+password')
        .exec();
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Invalid old password');
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }
}