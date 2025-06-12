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

    const superAdmin = await this.adminModel.findOne({ email:process.env.email! });

    if (superAdmin) {
      console.log('Super Admin already exists');
      return;
    }
    let superpassword= process.env.password!;
    const hashedPassword = await bcrypt.hash(superpassword, 10);

    const newSuperAdmin = new this.adminModel({
      email: process.env.email!,
      phone: process.env.phone!,
      password: hashedPassword,
      role: 0,
      name: 'Super',
      is_active: true,
    });

    await newSuperAdmin.save();
    console.log('Super Admin has been created');
  }
}
