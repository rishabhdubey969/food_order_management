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

  /**
   * Creates a new session and stores it in both MongoDB and Redis.
   * @param session - Partial session data to be created.
   */
  async createSession(session: Partial<Session>) {
    await this.sessionModel.create(session);
    await this.redisService.set(`session:${session.sessionId}`, JSON.stringify(session), 'EX', this.redisTTL);
  }

  /**
   * Retrieves a session by its ID from Redis or MongoDB.
   * @param sessionId - The ID of the session to retrieve.
   * @returns The session object if found, otherwise null.
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const cache = await this.redisService.get(`session:${sessionId}`);
    if (cache) return JSON.parse(cache);

    const session = await this.sessionModel.findOne({ sessionId }).lean();
    if (session) {
      await this.redisService.set(`session:${sessionId}`, JSON.stringify(session), 'EX', this.redisTTL);
    }

    return session;
  }

  /**
   * Retrieves a session by its ID from MongoDB.
   * @param sessionId - The ID of the session to retrieve.
   * @returns The session object if found, otherwise null.
   */
  async markSessionUsed(sessionId: string) {
    // await this.redisService.del(`user:${userId}`);
    await this.sessionModel.updateOne({ sessionId }, { used: true });
    await this.redisService.del(`session:${sessionId}`);
  }

  /**
   * Retrieves a session by its ID from MongoDB.
   * @param sessionId - The ID of the session to retrieve.
   * @returns The session object if found, otherwise null.
   */
  async logoutAll(userId: string) {
    const sessions = await this.sessionModel.find({ userId }).lean();

    await Promise.all(sessions.map((s) => this.redisService.del(`session:${s.sessionId}`)));

    await this.sessionModel.updateMany({ userId }, { used: true });
  }

  /**
   * Caches user data in Redis.
   * @param userId - The ID of the user to cache.
   */
  async redisUserCache(userId) {
    const user = await this.connection
      .collection(this.roleCollections.USER)
      .findOne({ _id: new Object(userId) }, { projection: { username: 1, email: 1, phone: 1, role: 1 } });

    await this.redisService.set(`user:${userId}`, user, '', 900);
  }

  /**
   * Retrieves user data from Redis cache.
   * @param userId - The ID of the user to retrieve from cache.
   * @returns The cached user data if found, otherwise null.
   */
  async redisGetUserCache(userId: string) {
    const redisKey = `user:${userId}`;
    return await this.redisService.get(redisKey);
  }

  /**
   * Checks if a session is valid (not used).
   * @param sessionId - The ID of the session to validate.
   * @returns True if the session is valid, otherwise false.
   */
  async isValidSession(sessionId: string) {
    const session = await this.sessionModel.findOne({ sessionId }).lean();
    return session?.used === false;
  }
}
