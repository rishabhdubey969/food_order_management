
// import { Injectable, OnModuleInit, OnModuleDestroy, InternalServerErrorException, Inject } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis, { Redis as RedisClient } from 'ioredis';
// import { Types } from 'mongoose';
// import { REDIS_CONSTANTS } from './redisContants';
// import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
// import { Logger } from 'winston';

// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private redisClient: RedisClient;

//   constructor(
//     private readonly configService: ConfigService,
//     @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
//   ) {}

//   async onModuleInit() {
//     this.logger.info('Initializing Redis client', {
//       service: 'RedisService',
//       method: 'onModuleInit'
//     });

//     try {
//       this.redisClient = new Redis({
//         host: this.configService.get<string>(REDIS_CONSTANTS.CONFIG.HOST_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_HOST,
//         port: this.configService.get<number>(REDIS_CONSTANTS.CONFIG.PORT_KEY) || REDIS_CONSTANTS.CONFIG.DEFAULT_PORT,
//         lazyConnect: true,
//       });

//       this.redisClient.on('connect', () => {
//         this.logger.info('Redis client connected', {
//           service: 'RedisService',
//           message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CONNECTED
//         });
//       });

//       this.redisClient.on('ready', () => {
//         this.logger.info('Redis client ready', {
//           service: 'RedisService',
//           message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_READY
//         });
//       });

//       this.redisClient.on('error', (err) => {
//         this.logger.error('Redis client error', {
//           service: 'RedisService',
//           error: err.message,
//           stack: err.stack
//         });
//       });

//       this.redisClient.on('close', () => {
//         this.logger.warn('Redis client closed unexpectedly', {
//           service: 'RedisService',
//           message: REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_CLOSED_UNEXPECTED
//         });
//       });

//       await this.redisClient.connect();
//       this.logger.info('Redis client initialized successfully', {
//         service: 'RedisService',
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_INIT
//       });
//     } catch (error) {
//       this.logger.error('Failed to initialize Redis client', {
//         service: 'RedisService',
//         method: 'onModuleInit',
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_INIT_FAILED);
//     }
//   }

//   async onModuleDestroy() {
//     this.logger.info('Closing Redis connection', {
//       service: 'RedisService',
//       method: 'onModuleDestroy'
//     });

//     if (this.redisClient && (this.redisClient.status === 'ready' || this.redisClient.status === 'connect')) {
//       try {
//         await this.redisClient.quit();
//         this.logger.info('Redis client closed successfully', {
//           service: 'RedisService',
//           message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CLIENT_CLOSED
//         });
//       } catch (error) {
//         this.logger.error('Failed to close Redis client', {
//           service: 'RedisService',
//           method: 'onModuleDestroy',
//           error: error.message,
//           stack: error.stack
//         });
//       }
//     } else {
//       this.logger.warn('Redis client not in ready state during shutdown', {
//         service: 'RedisService',
//         message: REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_ENABLED,
//         status: this.redisClient?.status || 'uninitialized'
//       });
//     }
//   }

//   private async ensureRedisClient(): Promise<RedisClient> {
//     if (!this.redisClient || this.redisClient.status !== 'ready') {
//       this.logger.warn('Redis client not ready', {
//         service: 'RedisService',
//         method: 'ensureRedisClient',
//         message: REDIS_CONSTANTS.MESSAGES.WARN.CLIENT_NOT_READY,
//         status: this.redisClient?.status || 'uninitialized'
//       });

//       try {
//         if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
//           await new Promise(resolve => this.redisClient.once('ready', resolve));
//         } else {
//           await this.redisClient.connect();
//           await new Promise(resolve => this.redisClient.once('ready', resolve));
//         }
//       } catch (error) {
//         this.logger.error('Failed to reconnect Redis client', {
//           service: 'RedisService',
//           method: 'ensureRedisClient',
//           error: error.message,
//           stack: error.stack
//         });
//         throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CLIENT_NOT_READY);
//       }
//     }
//     return this.redisClient;
//   }

//   async setData(key: string, value: string | object, ttl: number): Promise<void> {
//     this.logger.info('Setting Redis data', {
//       service: 'RedisService',
//       method: 'setData',
//       key,
//       ttl
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
//       await client.set(key, stringValue, 'EX', ttl);
//       this.logger.info('Data set successfully', {
//         service: 'RedisService',
//         method: 'setData',
//         key,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_SET
//       });
//     } catch (error) {
//       this.logger.error('Failed to set data', {
//         service: 'RedisService',
//         method: 'setData',
//         key,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for key "${key}"`);
//     }
//   }

//   async getData(key: string): Promise<string | null> {
//     this.logger.info('Getting Redis data', {
//       service: 'RedisService',
//       method: 'getData',
//       key
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       const data = await client.get(key);
      
//       if (!data) {
//         this.logger.warn('Key not found', {
//           service: 'RedisService',
//           method: 'getData',
//           key,
//           message: REDIS_CONSTANTS.MESSAGES.WARN.KEY_NOT_FOUND
//         });
//       } else {
//         this.logger.info('Data fetched successfully', {
//           service: 'RedisService',
//           method: 'getData',
//           key,
//           message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_FETCHED
//         });
//       }
      
//       return data;
//     } catch (error) {
//       this.logger.error('Failed to get data', {
//         service: 'RedisService',
//         method: 'getData',
//         key,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_FETCH_FAILED} for key "${key}"`);
//     }
//   }

//   async deleteData(key: string): Promise<void> {
//     this.logger.info('Deleting Redis data', {
//       service: 'RedisService',
//       method: 'deleteData',
//       key
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       await client.del(key);
//       this.logger.info('Data deleted successfully', {
//         service: 'RedisService',
//         method: 'deleteData',
//         key,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DATA_DELETED
//       });
//     } catch (error) {
//       this.logger.error('Failed to delete data', {
//         service: 'RedisService',
//         method: 'deleteData',
//         key,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for key "${key}"`);
//     }
//   }

//   async resetCache(): Promise<void> {
//     this.logger.info('Resetting Redis cache', {
//       service: 'RedisService',
//       method: 'resetCache'
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       await client.flushdb();
//       this.logger.info('Cache reset successfully', {
//         service: 'RedisService',
//         method: 'resetCache',
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.CACHE_CLEARED
//       });
//     } catch (error) {
//       this.logger.error('Failed to reset cache', {
//         service: 'RedisService',
//         method: 'resetCache',
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.CACHE_CLEAR_FAILED);
//     }
//   }

//   async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     this.logger.info('Updating driver location', {
//       service: 'RedisService',
//       method: 'updateDriverLocation',
//       partnerId,
//       longitude,
//       latitude
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       await client.geoadd(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, longitude, latitude, partnerId);
//       await this.setData(
//         `${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`, 
//         { longitude, latitude, timestamp: Date.now() }, 
//         REDIS_CONSTANTS.TTL.DRIVER_ACTIVE
//       );
//       this.logger.info('Driver location updated successfully', {
//         service: 'RedisService',
//         method: 'updateDriverLocation',
//         partnerId,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_LOCATION_UPDATED
//       });
//     } catch (error) {
//       this.logger.error('Failed to update driver location', {
//         service: 'RedisService',
//         method: 'updateDriverLocation',
//         partnerId,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_SET_FAILED} for driver "${partnerId}"`);
//     }
//   }

//   async removeDriver(partnerId: string): Promise<void> {
//     this.logger.info('Removing driver', {
//       service: 'RedisService',
//       method: 'removeDriver',
//       partnerId
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       await client.zrem(REDIS_CONSTANTS.KEYS.AVAILABLE_DRIVERS, partnerId);
//       await this.deleteData(`${REDIS_CONSTANTS.KEYS.DRIVER_ACTIVE_PREFIX}${partnerId}`);
//       this.logger.info('Driver removed successfully', {
//         service: 'RedisService',
//         method: 'removeDriver',
//         partnerId,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_REMOVED
//       });
//     } catch (error) {
//       this.logger.error('Failed to remove driver', {
//         service: 'RedisService',
//         method: 'removeDriver',
//         partnerId,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.DATA_DELETE_FAILED} for driver "${partnerId}"`);
//     }
//   }

//   async isKeyExists(key: string): Promise<boolean> {
//     this.logger.info('Checking key existence', {
//       service: 'RedisService',
//       method: 'isKeyExists',
//       key
//     });

//     try {
//       const client = await this.ensureRedisClient();
//       const exists = (await client.exists(key)) === 1;
//       this.logger.info('Key existence checked', {
//         service: 'RedisService',
//         method: 'isKeyExists',
//         key,
//         exists,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.KEY_EXISTS_CHECKED
//       });
//       return exists;
//     } catch (error) {
//       this.logger.error('Failed to check key existence', {
//         service: 'RedisService',
//         method: 'isKeyExists',
//         key,
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(`${REDIS_CONSTANTS.MESSAGES.ERROR.KEY_EXISTS_FAILED} for "${key}"`);
//     }
//   }

//   async findNearestDriver(
//     longitude: number,
//     latitude: number,
//     radiusKm: number,
//     count: number = 1,
//   ): Promise<[Types.ObjectId | null]> {
//     this.logger.info('Finding nearest drivers', {
//       service: 'RedisService',
//       method: 'findNearestDriver',
//       longitude,
//       latitude,
//       radiusKm,
//       count
//     });

//     try {
//       const client = await this.ensureRedisClient();
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
//         this.logger.warn('No drivers found', {
//           service: 'RedisService',
//           method: 'findNearestDriver',
//           message: REDIS_CONSTANTS.MESSAGES.WARN.NO_DRIVERS_FOUND
//         });
//         return [null];
//       }

//       const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
//       this.logger.info('Nearest drivers found', {
//         service: 'RedisService',
//         method: 'findNearestDriver',
//         count: drivers.length,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.NEAREST_DRIVERS_FOUND
//       });
//       return drivers as [Types.ObjectId | null];
//     } catch (error) {
//       this.logger.error('Failed to find nearest drivers', {
//         service: 'RedisService',
//         method: 'findNearestDriver',
//         error: error.message,
//         stack: error.stack
//       });
//       throw new InternalServerErrorException(REDIS_CONSTANTS.MESSAGES.ERROR.NEAREST_DRIVERS_FAILED);
//     }
//   }

//   async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     this.logger.info('Adding available driver', {
//       service: 'RedisService',
//       method: 'addAvailableDriver',
//       partnerId,
//       longitude,
//       latitude
//     });

//     try {
//       await this.updateDriverLocation(partnerId, longitude, latitude);
//       this.logger.info('Driver added successfully', {
//         service: 'RedisService',
//         method: 'addAvailableDriver',
//         partnerId,
//         message: REDIS_CONSTANTS.MESSAGES.SUCCESS.DRIVER_ADDED
//       });
//     } catch (error) {
//       this.logger.error('Failed to add available driver', {
//         service: 'RedisService',
//         method: 'addAvailableDriver',
//         partnerId,
//         error: error.message,
//         stack: error.stack
//       });
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

  /**
   * Initializes the RedisService with configuration and logging dependencies.
   *
   * Args:
   *   configService (ConfigService): Service to retrieve Redis configuration.
   *   logger (Logger): Winston logger for logging service events.
   */
  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async onModuleInit() {
    /**
     * Initializes the Redis client connection when the module starts.
     *
     * Returns:
     *   Promise<void>: No return value; completes the initialization process.
     *
     * Throws:
     *   InternalServerErrorException: If the Redis client fails to initialize.
     */
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
    /**
     * Closes the Redis client connection when the module is destroyed.
     *
     * Returns:
     *   Promise<void>: No return value; completes the disconnection process.
     */
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
    /**
     * Ensures the Redis client is ready for operations, reconnecting if necessary.
     *
     * Returns:
     *   Promise<RedisClient>: The ready Redis client instance.
     *
     * Throws:
     *   InternalServerErrorException: If the Redis client cannot be connected or made ready.
     */
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
    /**
     * Sets a key-value pair in Redis with a specified time-to-live (TTL).
     *
     * Args:
     *   key (string): The key to store the data under.
     *   value (string | object): The value to store (objects are JSON-stringified).
     *   ttl (number): The time-to-live in seconds for the key.
     *
     * Returns:
     *   Promise<void>: No return value; completes the data storage process.
     *
     * Throws:
     *   InternalServerErrorException: If storing the data fails.
     */
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
    /**
     * Retrieves a value from Redis by its key.
     *
     * Args:
     *   key (string): The key to retrieve the data for.
     *
     * Returns:
     *   Promise<string | null>: The stored value or null if the key does not exist.
     *
     * Throws:
     *   InternalServerErrorException: If retrieving the data fails.
     */
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
    /**
     * Deletes a key from Redis.
     *
     * Args:
     *   key (string): The key to delete.
     *
     * Returns:
     *   Promise<void>: No return value; completes the deletion process.
     *
     * Throws:
     *   InternalServerErrorException: If deleting the data fails.
     */
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
    /**
     * Clears all data from the Redis database.
     *
     * Returns:
     *   Promise<void>: No return value; completes the cache reset process.
     *
     * Throws:
     *   InternalServerErrorException: If clearing the cache fails.
     */
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
    /**
     * Updates the geospatial location of a driver in Redis.
     *
     * Args:
     *   partnerId (string): The unique identifier of the driver.
     *   longitude (number): The driver's longitude coordinate.
     *   latitude (number): The driver's latitude coordinate.
     *
     * Returns:
     *   Promise<void>: No return value; completes the location update process.
     *
     * Throws:
     *   InternalServerErrorException: If updating the driver location fails.
     */
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
    /**
     * Removes a driver from the Redis geospatial index and active driver cache.
     *
     * Args:
     *   partnerId (string): The unique identifier of the driver.
     *
     * Returns:
     *   Promise<void>: No return value; completes the removal process.
     *
     * Throws:
     *   InternalServerErrorException: If removing the driver fails.
     */
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
    /**
     * Checks if a key exists in Redis.
     *
     * Args:
     *   key (string): The key to check for existence.
     *
     * Returns:
     *   Promise<boolean>: True if the key exists, false otherwise.
     *
     * Throws:
     *   InternalServerErrorException: If checking the key existence fails.
     */
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
    /**
     * Finds the nearest drivers within a specified radius using Redis geospatial queries.
     *
     * Args:
     *   longitude (number): The longitude coordinate of the search center.
     *   latitude (number): The latitude coordinate of the search center.
     *   radiusKm (number): The search radius in kilometers.
     *   count (number, optional): The maximum number of drivers to return (default: 1).
     *
     * Returns:
     *   Promise<[Types.ObjectId | null]>: An array of driver IDs or null if no drivers are found.
     *
     * Throws:
     *   InternalServerErrorException: If the geospatial query fails.
     */
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
    /**
     * Adds a driver to the Redis geospatial index as available.
     *
     * Args:
     *   partnerId (string): The unique identifier of the driver.
     *   longitude (number): The driver's longitude coordinate.
     *   latitude (number): The driver's latitude coordinate.
     *
     * Returns:
     *   Promise<void>: No return value; completes the addition process.
     *
     * Throws:
     *   InternalServerErrorException: If adding the driver fails.
     */
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