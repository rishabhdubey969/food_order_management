import { Injectable, BadRequestException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import ManagerLoginDto from 'apps/restaurant/src/manager/dto/managerLogin.dto';
import ManagerSignupDto from 'apps/restaurant/src/manager/dto/managerSignup.dto';
import { Manager } from './schema/manager.schema';

// import { ClientGrpc } from '@nestjs/microservices';
// import { lastValueFrom } from 'rxjs';


@Injectable()
export class ManagerService {
    [x: string]: any;
    constructor(
        @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
        private readonly jwtService: JwtService
      ) {}

    async login(managerLoginDto: ManagerLoginDto) {
        const { email, password } = managerLoginDto;

        const manager = await this.managerModel.findOne({ email });
        if (!manager) {
          throw new UnauthorizedException('Invalid email or password');
        }
    
        const isPasswordValid = await bcrypt.compare(password, manager.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid email or password');
        }

        if (manager.isActive !== 'active') {
            throw new UnauthorizedException('Your account is not yet approved by the admin');
          }
    
        const payload = { sub: manager._id, email: manager.email, role: 'manager' };
        const token = this.jwtService.sign(payload, { expiresIn: '1d' });
    
        return {
          message: 'Login successful',
          token,
          data: {
            id: manager._id,
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
          }
        };
      }

    async signup(managerSignupDto: ManagerSignupDto) {
        const { email, phone, password, name, restaurantId,accountNumber,ifscCode,bankName, } = managerSignupDto;

    const existingManager = await this.managerModel.findOne({ email });
    if (existingManager) {
      throw new BadRequestException('Manager already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new this.managerModel({
        name,
        email,
        phone,
        password: hashedPassword,
        restaurantId,
        accountNumber,
        ifscCode,
        bankName,
        isActive: 'pending'
      });

    const savedManager = await newManager.save();

    return {
      message: 'Signup successful',
      data: {
        id: savedManager._id,
        name: savedManager.name,
        email: savedManager.email,
        phone: savedManager.phone,
        restaurantId: savedManager.restaurantId,
        accountNumber: savedManager.accountNumber,
        ifscCode: savedManager.ifscCode,
        bankName: savedManager.bankName,
      }
    };
  }

    async getManagerById(id: string) {
        const manager = await this.managerModel.findById(id);
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return {
      message: 'Manager found',
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
      }
    };
  }
  async activateManager(managerId: string) {
    const manager = await this.managerModel.findById(managerId);
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    manager.isActive = 'active';
    await manager.save();

    return {
      message: 'Manager approved successfully',
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        status: manager.isActive
      }
    };
  }
  
}