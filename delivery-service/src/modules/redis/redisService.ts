
// import { Injectable, Logger, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis, { Redis as RedisClient } from 'ioredis';
// import { Types } from 'mongoose';
// import { REDIS_CONSTANTS } from './redisContants';


// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(RedisService.name);
//   private redisClient: RedisClient;

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit() {
//     this.logger.log('Initializing Redis client...');
//     try {
//       this.redisClient = new Redis({
//         host: this.configService.get<string>(REDIS_CONSTANTS.CONFIG.HOST_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_HOST,
//         port: this.configService.get<number>(REDIS_CONSTANTS.CONFIG.PORT_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_PORT,
//         lazyConnect: true,
//       });

//       this.redisClient.on('connect', () => {
//         this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CONNECTED);
//       });

//       this.redisClient.on('ready', () => {
//         this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_READY);
//       });

//       this.redisClient.on('error', (err) => {
//         this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_ERROR}: ${err.message}`, err.stack);
//       });

//       this.redisClient.on('close', () => {
//         this.logger.warn(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_CLOSED_UNEXPECTED);
//       });

//       await this.redisClient.connect();
//       this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_INIT);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED}: ${error.message}`);
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED);
//     }
//   }

//   async onModuleDestroy() {
//     this.logger.log('Closing Redis database...');
//     if (this.redisClient && (this.redisClient.status === 'ready' || this.redisClient.status === 'connect')) {
//       await this.redisClient.quit();
//       this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CLOSED);
//     } else {
//       this.logger.warn(REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_ENABLED);
//     }
//   }

//   private async ensureRedisClient(): Promise<RedisClient> {
//     if (!this.redisClient || this.redisClient.status !== 'ready') {
//       this.logger.warn(`${REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_NOT_READY}. Current status: ${this.redisClient?.status || 'uninitialized'}. Attempting to reconnect`);
//       if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
//         await new Promise(resolve => this.redisClient.once('ready', resolve));
//       } else {
//         await this.redisClient.connect();
//         await new Promise(resolve => this.redisClient.once('ready', resolve));
//       }
//     }
//     if (this.redisClient.status !== 'ready') {
//       this.logger.error(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
//     }
//     return this.redisClient;
//   }

//   async setData(key: string, value: string | object, ttl: number): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Setting data for key: ${key}`);
//       await client.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value), 'EX', ttl);
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_SET}: ${key}`);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}"`);
//     }
//   }

//   async getData(key: string): Promise<string | null> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Fetching data for key: ${key}`);
//       const data: string | null = await client.get(key);
//       if (!data) {
//         this.logger.warn(`${REDIS_CONSTANTS.MESSAGES.WARN.KEY_NOT_FOUND}: ${key}`);
//       }
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_FETCHED}: ${key}`);
//       return data;
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}"`);
//     }
//   }

//   async deleteData(key: string): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Deleting data for key: ${key}`);
//       await client.del(key);
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_DELETED}: ${key}`);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}"`);
//     }
//   }

//   async resetCache(): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log('Clearing entire Redis database using FLUSHDB...');
//       await client.flushdb();
//       this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CACHE_CLEARED);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED);
//     }
//   }

//   async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Updating location for driver: ${partnerId}`);
//       await client.geoadd(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, longitude, latitude, partnerId);
//       await this.setData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`, { longitude, latitude, timestamp: Date.now() }, REDIS_CONSTANTS.TTL.DRIVER_ACTIVE);
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_LOCATION_UPDATED}: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
//     }
//   }

//   async removeDriver(partnerId: string): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Removing driver: ${partnerId}`);
//       await client.zrem(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, partnerId);
//       await this.deleteData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`);
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_REMOVED}: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}"`);
//     }
//   }

//   async isKeyExists(key: string): Promise<boolean> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Checking existence of key: ${key}`);
//       const exists = (await client.exists(key)) === 1;
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.KEY_EXISTS_CHECKED}: ${key} exists: ${exists}`);
//       return exists;
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}"`);
//     }
//   }

//   async findNearestDriver(
//     longitude: number,
//     latitude: number,
//     radiusKm: number,
//     count: number = 1,
//   ): Promise<[Types.ObjectId | null]> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}${REDIS_CONSTANTS.GEOSPATIAL.UNIT} (count: ${count})`);
//       const results = await client.georadius(
//         REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS,
//         longitude,
//         latitude,
//         radiusKm,
//         REDIS_CONSTANTS.GEOSPATIAL.UNIT,
//         'WITHDIST',
//         'ASC',
//         'COUNT',
//         count,
//       );

//       if (!results || results.length === 0) {
//         this.logger.warn(REDIS_CONSTANTS.MESSAGES.WARN.NO_DRIVERS_FOUND);
//         return [null];
//       }

//       const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.NEAREST_DRIVERS_FOUND}: ${drivers.length}`);
//       return drivers as [Types.ObjectId | null];
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED);
//     }
//   }

//   async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       this.logger.log(`Adding available driver: ${partnerId}`);
//       await this.updateDriverLocation(partnerId, longitude, latitude);
//       this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_ADDED}: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
//     }
//   }
// }

import { Injectable, OnModuleInit, OnModuleDestroy, InternalServerErrorException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';
import { Types } from 'mongoose';
import { REDIS_CONSTANTS } from './redisContants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClient;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async onModuleInit() {
    this.logger.info('Initializing Redis client', {
      service: 'RedisService',
      method: 'onModuleInit'
    });

    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>(REDIS_CONSTANTS.CONFIG.HOST_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_HOST,
        port: this.configService.get<number>(REDIS_CONSTANTS.CONFIG.PORT_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_PORT,
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.logger.info('Redis client connected', {
          service: 'RedisService',
          message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CONNECTED
        });
      });

      this.redisClient.on('ready', () => {
        this.logger.info('Redis client ready', {
          service: 'RedisService',
          message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_READY
        });
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis client error', {
          service: 'RedisService',
          error: err.message,
          stack: err.stack
        });
      });

      this.redisClient.on('close', () => {
        this.logger.warn('Redis client closed unexpectedly', {
          service: 'RedisService',
          message: REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_CLOSED_UNEXPECTED
        });
      });

      await this.redisClient.connect();
      this.logger.info('Redis client initialized successfully', {
        service: 'RedisService',
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_INIT
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', {
        service: 'RedisService',
        method: 'onModuleInit',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED);
    }
  }

  async onModuleDestroy() {
    this.logger.info('Closing Redis connection', {
      service: 'RedisService',
      method: 'onModuleDestroy'
    });

    if (this.redisClient && (this.redisClient.status === 'ready' || this.redisClient.status === 'connect')) {
      try {
        await this.redisClient.quit();
        this.logger.info('Redis client closed successfully', {
          service: 'RedisService',
          message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CLOSED
        });
      } catch (error) {
        this.logger.error('Failed to close Redis client', {
          service: 'RedisService',
          method: 'onModuleDestroy',
          error: error.message,
          stack: error.stack
        });
      }
    } else {
      this.logger.warn('Redis client not in ready state during shutdown', {
        service: 'RedisService',
        message: REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_ENABLED,
        status: this.redisClient?.status || 'uninitialized'
      });
    }
  }

  private async ensureRedisClient(): Promise<RedisClient> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      this.logger.warn('Redis client not ready', {
        service: 'RedisService',
        method: 'ensureRedisClient',
        message: REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_NOT_READY,
        status: this.redisClient?.status || 'uninitialized'
      });

      try {
        if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
          await new Promise(resolve => this.redisClient.once('ready', resolve));
        } else {
          await this.redisClient.connect();
          await new Promise(resolve => this.redisClient.once('ready', resolve));
        }
      } catch (error) {
        this.logger.error('Failed to reconnect Redis client', {
          service: 'RedisService',
          method: 'ensureRedisClient',
          error: error.message,
          stack: error.stack
        });
        throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
      }
    }
    return this.redisClient;
  }

  async setData(key: string, value: string | object, ttl: number): Promise<void> {
    this.logger.info('Setting Redis data', {
      service: 'RedisService',
      method: 'setData',
      key,
      ttl
    });

    try {
      const client = await this.ensureRedisClient();
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await client.set(key, stringValue, 'EX', ttl);
      this.logger.info('Data set successfully', {
        service: 'RedisService',
        method: 'setData',
        key,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_SET
      });
    } catch (error) {
      this.logger.error('Failed to set data', {
        service: 'RedisService',
        method: 'setData',
        key,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}"`);
    }
  }

  async getData(key: string): Promise<string | null> {
    this.logger.info('Getting Redis data', {
      service: 'RedisService',
      method: 'getData',
      key
    });

    try {
      const client = await this.ensureRedisClient();
      const data = await client.get(key);
      
      if (!data) {
        this.logger.warn('Key not found', {
          service: 'RedisService',
          method: 'getData',
          key,
          message: REDIS_CONSTANTS.MESSAGES.WARN.KEY_NOT_FOUND
        });
      } else {
        this.logger.info('Data fetched successfully', {
          service: 'RedisService',
          method: 'getData',
          key,
          message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_FETCHED
        });
      }
      
      return data;
    } catch (error) {
      this.logger.error('Failed to get data', {
        service: 'RedisService',
        method: 'getData',
        key,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}"`);
    }
  }

  async deleteData(key: string): Promise<void> {
    this.logger.info('Deleting Redis data', {
      service: 'RedisService',
      method: 'deleteData',
      key
    });

    try {
      const client = await this.ensureRedisClient();
      await client.del(key);
      this.logger.info('Data deleted successfully', {
        service: 'RedisService',
        method: 'deleteData',
        key,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_DELETED
      });
    } catch (error) {
      this.logger.error('Failed to delete data', {
        service: 'RedisService',
        method: 'deleteData',
        key,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}"`);
    }
  }

  async resetCache(): Promise<void> {
    this.logger.info('Resetting Redis cache', {
      service: 'RedisService',
      method: 'resetCache'
    });

    try {
      const client = await this.ensureRedisClient();
      await client.flushdb();
      this.logger.info('Cache reset successfully', {
        service: 'RedisService',
        method: 'resetCache',
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CACHE_CLEARED
      });
    } catch (error) {
      this.logger.error('Failed to reset cache', {
        service: 'RedisService',
        method: 'resetCache',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED);
    }
  }

  async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
    this.logger.info('Updating driver location', {
      service: 'RedisService',
      method: 'updateDriverLocation',
      partnerId,
      longitude,
      latitude
    });

    try {
      const client = await this.ensureRedisClient();
      await client.geoadd(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, longitude, latitude, partnerId);
      await this.setData(
        `${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`, 
        { longitude, latitude, timestamp: Date.now() }, 
        REDIS_CONSTANTS.TTL.DRIVER_ACTIVE
      );
      this.logger.info('Driver location updated successfully', {
        service: 'RedisService',
        method: 'updateDriverLocation',
        partnerId,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_LOCATION_UPDATED
      });
    } catch (error) {
      this.logger.error('Failed to update driver location', {
        service: 'RedisService',
        method: 'updateDriverLocation',
        partnerId,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
    }
  }

  async removeDriver(partnerId: string): Promise<void> {
    this.logger.info('Removing driver', {
      service: 'RedisService',
      method: 'removeDriver',
      partnerId
    });

    try {
      const client = await this.ensureRedisClient();
      await client.zrem(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, partnerId);
      await this.deleteData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`);
      this.logger.info('Driver removed successfully', {
        service: 'RedisService',
        method: 'removeDriver',
        partnerId,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_REMOVED
      });
    } catch (error) {
      this.logger.error('Failed to remove driver', {
        service: 'RedisService',
        method: 'removeDriver',
        partnerId,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}"`);
    }
  }

  async isKeyExists(key: string): Promise<boolean> {
    this.logger.info('Checking key existence', {
      service: 'RedisService',
      method: 'isKeyExists',
      key
    });

    try {
      const client = await this.ensureRedisClient();
      const exists = (await client.exists(key)) === 1;
      this.logger.info('Key existence checked', {
        service: 'RedisService',
        method: 'isKeyExists',
        key,
        exists,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.KEY_EXISTS_CHECKED
      });
      return exists;
    } catch (error) {
      this.logger.error('Failed to check key existence', {
        service: 'RedisService',
        method: 'isKeyExists',
        key,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}"`);
    }
  }

  async findNearestDriver(
    longitude: number,
    latitude: number,
    radiusKm: number,
    count: number = 1,
  ): Promise<[Types.ObjectId | null]> {
    this.logger.info('Finding nearest drivers', {
      service: 'RedisService',
      method: 'findNearestDriver',
      longitude,
      latitude,
      radiusKm,
      count
    });

    try {
      const client = await this.ensureRedisClient();
      const results = await client.georadius(
        REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS,
        longitude,
        latitude,
        radiusKm,
        REDIS_CONSTANTS.GEOSPATIAL.UNIT,
        'WITHDIST',
        'ASC',
        'COUNT',
        count,
      );

      if (!results || results.length === 0) {
        this.logger.warn('No drivers found', {
          service: 'RedisService',
          method: 'findNearestDriver',
          message: REDIS_CONSTANTS.MESSAGES.WARN.NO_DRIVERS_FOUND
        });
        return [null];
      }

      const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
      this.logger.info('Nearest drivers found', {
        service: 'RedisService',
        method: 'findNearestDriver',
        count: drivers.length,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.NEAREST_DRIVERS_FOUND
      });
      return drivers as [Types.ObjectId | null];
    } catch (error) {
      this.logger.error('Failed to find nearest drivers', {
        service: 'RedisService',
        method: 'findNearestDriver',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED);
    }
  }

  async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
    this.logger.info('Adding available driver', {
      service: 'RedisService',
      method: 'addAvailableDriver',
      partnerId,
      longitude,
      latitude
    });

    try {
      await this.updateDriverLocation(partnerId, longitude, latitude);
      this.logger.info('Driver added successfully', {
        service: 'RedisService',
        method: 'addAvailableDriver',
        partnerId,
        message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_ADDED
      });
    } catch (error) {
      this.logger.error('Failed to add available driver', {
        service: 'RedisService',
        method: 'addAvailableDriver',
        partnerId,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
    }
  }
}