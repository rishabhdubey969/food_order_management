import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { Manager } from './entities/manager.entity';
import { ListUsersDto } from './dto/list-users.dto';

// Interface to represent the shape of lean documents
interface LeanUser {
  _id: string;
  email: string;
  phone?: string;
  role: number;
  username: string;
  createdAt: Date;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
  ) {}

  async findAll(listUsersDto: ListUsersDto) {
    // 1. Prepare base filter
    const filter: any = {
      is_active: true,
      is_deleted: false,
    };

    // 2. Improved role handling
    let TargetModel: Model<User | Manager> = this.userModel;
    if (listUsersDto.role) {
      if (listUsersDto.role === 'admin') {
        filter.role = 1;
        TargetModel = this.userModel; // Admins are in the users collection
      } else if (listUsersDto.role === 'user') {
        filter.role = 2;
        TargetModel = this.userModel; // Users are in the users collection
      } else if (listUsersDto.role === 'manager') {
        filter.role = 3;
        TargetModel = this.managerModel; // Managers are in the managers collection
      }
      // Else ignore invalid role values
    }

    // 3. Pagination setup
    const page = Math.max(1, Number(listUsersDto.page) || 1);
    const limit = Math.max(1, Math.min(Number(listUsersDto.limit) || 10, 100));
    const skip = (page - 1) * limit;

    // 4. Query execution
    let users: LeanUser[];
    let total: number;

    if (listUsersDto.role) {
      // Query the specific collection based on role
      [users, total] = await Promise.all([
        TargetModel.find(filter)
          .select('_id email phone role username createdAt') // Only these fields
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec() as unknown as Promise<LeanUser[]>, // Safer type assertion
        TargetModel.countDocuments(filter),
      ]);
    } else {
      // Query both collections if no role is specified
      const [userResults, managerResults, userCount, managerCount] = await Promise.all([
        this.userModel
          .find({ is_active: true, is_deleted: false })
          .select('_id email phone role username createdAt')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec() as unknown as Promise<LeanUser[]>, // Safer type assertion
        this.managerModel
          .find({ is_active: true, is_deleted: false })
          .select('_id email phone role username createdAt')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec() as unknown as Promise<LeanUser[]>, // Safer type assertion
        this.userModel.countDocuments({ is_active: true, is_deleted: false }),
        this.managerModel.countDocuments({ is_active: true, is_deleted: false }),
      ]);

      // Merge and sort results
      users = [...userResults, ...managerResults]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      total = userCount + managerCount;
    }

    // 5. Convert numeric roles back to strings for client
    const formattedUsers = users.map(user => ({
      ...user,
      role: user.role === 1 ? 'admin' : user.role === 3 ? 'manager' : 'user',
    }));

    return {
      data: formattedUsers,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }
}