import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Session } from './schema/session.schema';
import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Model, Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionService {
  private readonly roleCollections = {
    USER: 'users',
  };
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly redisService: RedisService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private readonly redisTTL = 60 * 60 * 24 * 7; // 7 days

  async createSession(session: Partial<Session>) {
    await this.sessionModel.create(session);
    await this.redisService.set(`session:${session.sessionId}`, JSON.stringify(session), 'EX', this.redisTTL);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const cache = await this.redisService.get(`session:${sessionId}`);
    if (cache) return JSON.parse(cache);

    const session = await this.sessionModel.findOne({ sessionId }).lean();
    if (session) {
      await this.redisService.set(`session:${sessionId}`, JSON.stringify(session), 'EX', this.redisTTL);
    }

    return session;
  }

  async markSessionUsed(sessionId: string) {
    // await this.redisService.del(`user:${userId}`);
    await this.sessionModel.updateOne({ sessionId }, { used: true });
    await this.redisService.del(`session:${sessionId}`);
  }

  async logoutAll(userId: string) {
    const sessions = await this.sessionModel.find({ userId }).lean();

    await Promise.all(sessions.map((s) => this.redisService.del(`session:${s.sessionId}`)));

    await this.sessionModel.updateMany({ userId }, { used: true });
  }

  async redisUserCache(userId) {
    const user = await this.connection
      .collection(this.roleCollections.USER)
      .findOne({ _id: new Object(userId) }, { projection: { username: 1, email: 1, phone: 1, role: 1 } });

    await this.redisService.set(`user:${userId}`, user, '', 900);
  }

  async redisGetUserCache(userId: string) {
    const redisKey = `user:${userId}`;
    return await this.redisService.get(redisKey);
  }
<<<<<<< Updated upstream
=======

  async isValidSession(sessionId: string) {
    const session = await this.sessionModel.findOne({ sessionId }).lean();
    return session?.used === false;
  }

>>>>>>> Stashed changes
}
