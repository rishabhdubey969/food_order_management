import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin } from './entities/seeder.entity';
import { CreateAdminDto } from './dto/create-seeder.dto';
import { ListUsersDto } from '../user/dto/list-users.dto';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(Admin.name) 
    private readonly adminModel: Model<Admin>,
  ) {}

  async seedDefaultAdmin() {
    const adminData: CreateAdminDto = {
      email: 'admin@example.com',
      name: 'PriyanshiAdmin',
      password: 'Admin@123',
    };

    const existingAdmin = await this.adminModel.findOne({ 
      email: adminData.email 
    }).exec();

    if (existingAdmin) {
      return { message: 'Admin already exists' };
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = new this.adminModel({
      ...adminData,
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    return { message: 'Admin created successfully' };
  }


  async findAllAdmin(){
    return this.adminModel.find();
  }
}