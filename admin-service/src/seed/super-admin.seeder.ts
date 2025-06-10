import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auth, AuthenticationDocument } from '../api/auth/entities/auth.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(Auth.name) private adminModel: Model<AuthenticationDocument>,
  ) {}

  async seedSuperAdmin() {
    const superAdmin = await this.adminModel.findOne({ email: 'priyanshi@appinventiv.com' });

    if (superAdmin) {
      console.log('Super Admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('SuperAdminPassword', 10);

    const newSuperAdmin = new this.adminModel({
      email: 'priyanshi@appinventiv.com',
      phone: '3840383490',
      password: hashedPassword,
      role: 0,
      name: 'Super',
      is_active: true,
    });

    await newSuperAdmin.save();
    console.log('Super Admin has been created');
  }
}
