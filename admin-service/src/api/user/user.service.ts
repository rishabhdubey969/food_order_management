import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}
async findAll(listUsersDto: ListUsersDto) {
  // 1. Prepare base filter
  const filter: any = {
    is_active: true,
    is_deleted: false
  };

  // 2. Improved role handling
  if (listUsersDto.role) {
    if (listUsersDto.role === 'admin') {
      filter.role = 1;
    } else if (listUsersDto.role === 'user') { // Changed from 'customer' to 'user'
      filter.role = 2;
    }
    // Else ignore invalid role values
  }
    // 3. Pagination setup
    const page = Math.max(1, Number(listUsersDto.page) || 1);
    const limit = Math.max(1, Math.min(Number(listUsersDto.limit) || 10, 100));
    const skip = (page - 1) * limit;

    // 4. Query execution (PROJECTION to match your frontend needs)
    const [users, total] = await Promise.all([
      this.userModel.find()
        .select('_id email phone role username createdAt') // Only these fields
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.userModel.countDocuments(filter)
    ]);

    // 5. Convert numeric roles back to strings for client
    const formattedUsers = users.map(user => ({
      ...user,
      role: user.role === 1 ? 'admin' : 'user' // Optional: Convert numbers to strings
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