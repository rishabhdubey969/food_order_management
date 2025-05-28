// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
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
import { UpdatePasswordDto } from './dto/updatepasssword';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, phone, role } = registerDto;

    if (role === 'admin') {
      throw new Error('Admin registration is not allowed');
    }

    const isManager = role === 'manager';
    const TargetModel = isManager ? this.managerModel : this.userModel;

    const existingUser = await TargetModel.findOne({
      email,
      is_deleted: false,
    }).exec();
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new TargetModel({
      email,
      password: hashedPassword,
      username,
      phone,
      role: isManager ? 3 : 2,
      is_active: true,
      is_deleted: false,
    });

    await newUser.save();

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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

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
      throw new Error('Invalid credentials');
    }

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

  async logout(userId: string) {
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    let user = await this.userModel
      .findOne({ email, is_active: true, is_deleted: false })
      .exec();
    if (!user) {
      user = await this.managerModel
        .findOne({ email, is_active: true, is_deleted: false })
        .exec();
    }

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = this.jwtService.sign(
      { sub: user._id, email: user.email },
      { expiresIn: '1h' },
    );

    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000);
    await user.save();

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

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    let payload;
    // We need a local try-catch here for token verification
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }

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
      throw new Error('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }
}