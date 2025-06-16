

// import { Injectable, Logger, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis, { Redis as RedisClient } from 'ioredis';
// import { Types } from 'mongoose';



// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(RedisService.name);
//   private redisClient: RedisClient;

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit() {
//     this.logger.log('Initializing Redis client...');
//     try {
//       this.redisClient = new Redis({
//         host: this.configService.get<string>('redis.host') || 'localhost',
//         port: this.configService.get<number>('redis.port') || 6379,
//         lazyConnect: true, 
//       });

//       this.redisClient.on('connect', () => {
//         this.logger.log('Redis client connected successfully.');
//       });

//       this.redisClient.on('ready', () => {
//         this.logger.log('Redis client is ready (connected and authenticated).');
//       });

//       this.redisClient.on('error', (err) => {
//         this.logger.error(`Redis client error: ${err.message}`, err.stack);
//       });

//       this.redisClient.on('close', () => {
//         this.logger.warn('Redis client connection closed.');
//       });

//       await this.redisClient.connect();
//       this.logger.log('Redis client connection attempt initiated.');

//     } catch (error) {
//       this.logger.error(`Error initializing Redis client: ${error.message}`, error.stack);
//       throw new InternalServerErrorException('Failed to initialize Redis client.');
//     }
//   }

//   async onModuleDestroy() {
//     this.logger.log('Closing Redis client connection...');
//     if (this.redisClient && this.redisClient.status === 'ready' || this.redisClient.status === 'connect') {
//       await this.redisClient.quit();
//       this.logger.log('Redis client connection closed gracefully.');
//     } else {
//       this.logger.warn('Redis client not connected or already closed during OnModuleDestroy.');
//     }
//   }

//   private async ensureRedisClient(): Promise<RedisClient> {
//     if (!this.redisClient || this.redisClient.status !== 'ready') {
//       this.logger.warn(`Redis client not ready. Current status: ${this.redisClient?.status || 'uninitialized'}. Attempting to reconnect.`);
//       if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {

//         await new Promise(resolve => this.redisClient.once('ready', resolve));
//       } else {
        
//         await this.redisClient.connect();
//         await new Promise(resolve => this.redisClient.once('ready', resolve));
//       }
//     }
//     if (this.redisClient.status !== 'ready') {
//       this.logger.error('Redis client is still not ready after connection attempt.');
//       throw new InternalServerErrorException('Redis client is not connected or ready.');
//     }
//     return this.redisClient;
//   }


//   async setData(key: string, value: string | object, ttl: number): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Setting data for key: ${key}`);

//       await client.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value), 'EX', ttl); // TTL in seconds
//       this.logger.log(`Data set successfully for key: ${key}`);
//     } catch (error) {
//       this.logger.error(`Error setting data for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`Failed to set data in Redis for key "${key}".`);
//     }
//   }

//   async getData(key: string): Promise<string | null> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Fetching data for key: ${key}`);
//       const data: string | null = await client.get(key);
//       if (!data) {
//         this.logger.warn(`Key not found: ${key}`);
//       }
//       return data;
//     } catch (error) {
//       this.logger.error(`Error getting data for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`Failed to retrieve data from Redis for key "${key}".`);
//     }
//   }

//   async deleteData(key: string): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Deleting data for key: ${key}`);
//       await client.del(key);
//       this.logger.log(`Data deleted successfully for key: ${key}`);
//     } catch (error) {
//       this.logger.error(`Error deleting data for key "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`Failed to delete data from Redis for key "${key}".`);
//     }
//   }

//   async resetCache(): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log('Clearing entire Redis database using FLUSHDB...');
//       await client.flushdb();
//       this.logger.log('Redis cache cleared successfully');
//     } catch (error) {
//       this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
//       throw new InternalServerErrorException('Failed to clear entire Redis cache.');
//     }
//   }

//   async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Updating location for driver: ${partnerId}`);
      
//       await client.geoadd('availableDrivers', longitude, latitude, partnerId);
//       await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300); // Reusing setData
//       this.logger.log(`Location updated for driver: ${partnerId}`);
//     } catch (error) {
//       throw error;
//     }
//   }

//   async removeDriver(partnerId: string): Promise<void> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Removing driver: ${partnerId}`);
//       await client.zrem('availableDrivers', partnerId);
//       await this.deleteData(`driverActive:${partnerId}`);
//       this.logger.log(`Driver removed successfully: ${partnerId}`);
//     } catch (error) {
//       throw error
//     }
//   }

//   async isKeyExists(key: string): Promise<boolean> {
//     try {
//       const client = await this.ensureRedisClient();
//       this.logger.log(`Checking existence of key: ${key}`);
//       const exists = (await client.exists(key)) === 1;
//       this.logger.log(`Key ${key} exists: ${exists}`);
//       return exists;
//     } catch (error) {
//       this.logger.error(`Error checking key existence "${key}": ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`Failed to check key existence for "${key}".`);
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
//       this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}km (count: ${count})`);


//       const results = await client.georadius(
//         'availableDrivers',
//         longitude,
//         latitude,
//         radiusKm,
//         'km',
//         'WITHDIST',
//         'ASC',
//         'COUNT',
//         count,
//       );

//       if (!results || results.length === 0) {
//         this.logger.warn('No drivers found in the specified radius');
//         return [null];
//       }

      
//       const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
//       this.logger.log(`Found ${drivers.length} nearest drivers`);

//       return drivers as [Types.ObjectId | null];
//     } catch (error) {
//       this.logger.error(`Error finding nearest driver: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(`Failed to find nearest drivers.`);
//     }
//   }

//   async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       this.logger.log(`Adding available driver: ${partnerId}`);
      
//       await this.updateDriverLocation(partnerId, longitude, latitude);
//       this.logger.log(`Driver added successfully: ${partnerId}`);
//     } catch (error) {
//       throw error;
//     }
//   }
// }

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';
import { Types } from 'mongoose';
import { REDIS_CONSTANTS } from './redisContants';


@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Redis client...');
    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>(REDIS_CONSTANTS.CONFIG.HOST_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_HOST,
        port: this.configService.get<number>(REDIS_CONSTANTS.CONFIG.PORT_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_PORT,
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CONNECTED);
      });

      this.redisClient.on('ready', () => {
        this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_READY);
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_ERROR}: ${err.message}`, err.stack);
      });

      this.redisClient.on('close', () => {
        this.logger.warn(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_CLOSED_UNEXPECTED);
      });

      await this.redisClient.connect();
      this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_INIT);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED}: ${error.message}`);
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis database...');
    if (this.redisClient && (this.redisClient.status === 'ready' || this.redisClient.status === 'connect')) {
      await this.redisClient.quit();
      this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CLOSED);
    } else {
      this.logger.warn(REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_ENABLED);
    }
  }

  private async ensureRedisClient(): Promise<RedisClient> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      this.logger.warn(`${REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_NOT_READY}. Current status: ${this.redisClient?.status || 'uninitialized'}. Attempting to reconnect`);
      if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
        await new Promise(resolve => this.redisClient.once('ready', resolve));
      } else {
        await this.redisClient.connect();
        await new Promise(resolve => this.redisClient.once('ready', resolve));
      }
    }
    if (this.redisClient.status !== 'ready') {
      this.logger.error(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
    }
    return this.redisClient;
  }

  async setData(key: string, value: string | object, ttl: number): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Setting data for key: ${key}`);
      await client.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value), 'EX', ttl);
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_SET}: ${key}`);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}"`);
    }
  }

  async getData(key: string): Promise<string | null> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Fetching data for key: ${key}`);
      const data: string | null = await client.get(key);
      if (!data) {
        this.logger.warn(`${REDIS_CONSTANTS.MESSAGES.WARN.KEY_NOT_FOUND}: ${key}`);
      }
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_FETCHED}: ${key}`);
      return data;
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}"`);
    }
  }

  async deleteData(key: string): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Deleting data for key: ${key}`);
      await client.del(key);
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_DELETED}: ${key}`);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}"`);
    }
  }

  async resetCache(): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log('Clearing entire Redis database using FLUSHDB...');
      await client.flushdb();
      this.logger.log(REDIS_CONSTANTS.MESSAGES.SUCCESS.CACHE_CLEARED);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED);
    }
  }

  async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Updating location for driver: ${partnerId}`);
      await client.geoadd(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, longitude, latitude, partnerId);
      await this.setData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`, { longitude, latitude, timestamp: Date.now() }, REDIS_CONSTANTS.TTL.DRIVER_ACTIVE);
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_LOCATION_UPDATED}: ${partnerId}`);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
    }
  }

  async removeDriver(partnerId: string): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Removing driver: ${partnerId}`);
      await client.zrem(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, partnerId);
      await this.deleteData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`);
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_REMOVED}: ${partnerId}`);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}"`);
    }
  }

  async isKeyExists(key: string): Promise<boolean> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Checking existence of key: ${key}`);
      const exists = (await client.exists(key)) === 1;
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.KEY_EXISTS_CHECKED}: ${key} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}"`);
    }
  }

  async findNearestDriver(
    longitude: number,
    latitude: number,
    radiusKm: number,
    count: number = 1,
  ): Promise<[Types.ObjectId | null]> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}${REDIS_CONSTANTS.GEOSPATIAL.UNIT} (count: ${count})`);
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
        this.logger.warn(REDIS_CONSTANTS.MESSAGES.WARN.NO_DRIVERS_FOUND);
        return [null];
      }

      const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.NEAREST_DRIVERS_FOUND}: ${drivers.length}`);
      return drivers as [Types.ObjectId | null];
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED);
    }
  }

  async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      this.logger.log(`Adding available driver: ${partnerId}`);
      await this.updateDriverLocation(partnerId, longitude, latitude);
      this.logger.log(`${REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_ADDED}: ${partnerId}`);
    } catch (error) {
      this.logger.error(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
    }
  }
}