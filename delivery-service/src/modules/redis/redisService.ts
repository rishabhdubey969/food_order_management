
// import { Inject, Injectable} from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';

// @Injectable()
// export class RedisService {
//     constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache){}

//     async setData(key: string, value: string, ttl: number){
//         await this.cacheManager.set(key, value, ttl);
//     }

//     async getData(key: string){
//         return await this.cacheManager.get(key);
//     }

//     async deleteData(key: string){
//         await this.cacheManager.del(key);
//     }

//     async resetCache() {
//         await this.cacheManager.clear();
//     }

//     async updateDriverLocation(driverId: string, lat: number, lng: number) {
//     await this.cacheManager.geoadd('available_drivers', lng, lat, driverId);
//     await this.cacheManager.expire(driverId, 300); // 5 minutes expiration
//   }

//   async removeDriver(driverId: string) {
//     await this.cacheManager.zrem('available_drivers', driverId);
//   }

//   async findNearestDriver(lat: number, lng: number, radiusKm: number) {
//     const results = await this.cacheManager.georadius(
//       'available_drivers',
//       lng,
//       lat,
//       radiusKm,
//       'km',
//       'WITHDIST',
//       'ASC',
//       'COUNT',
//       1,
//     );
//     return results[0] || [null, null];
//   }

//   async addAvailableDriver(driverId: string, lat: number, lng: number) {
//     await this.updateDriverLocation(driverId, lat, lng);
//   }
// }


// -----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------


// import { Inject, Injectable} from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
// import { Types } from 'mongoose';


// @Injectable()
// export class RedisService {
//     constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache){}

//     private get redisClient(): any {
//         return (this.cacheManager as any).store.client;
//     }

//     async setData(key: string, value: string | object, ttl: number): Promise<void> {
//         try {
//             await this.cacheManager.set(key, value, ttl * 1000);
//         } catch (error) {
//             console.error(`RedisService: Error setting data for key "${key}":`, error);
//             throw error;
//         }
//     }

//     async getData(key: string): Promise<string | null> {
//         try {
//             return await this.cacheManager.get(key);
//         } catch (error) {
//             console.error(`RedisService: Error getting data for key "${key}":`, error);
//             throw error;
//         }
//     }

//     async deleteData(key: string): Promise<void> {
//         try {
//             await this.cacheManager.del(key);
//         } catch (error) {
//             console.error(`RedisService: Error deleting data for key "${key}":`, error);
//             throw error;
//         }
//     }

//     async resetCache(): Promise<void> {
//         try {
//             await this.cacheManager.clear();
//         } catch (error) {
//             console.error("RedisService: Error clearing cache:", error);
//             throw error;
//         }
//     }

//     async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
//         try {
//             await this.redisClient.geoadd('availableDrivers', longitude, latitude, partnerId);
//             await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300);
//         } catch (error) {
//             console.error(`RedisService: Error updating driver location for "${partnerId}":`, error);
//             throw error;
//         }
//     }

//     async removeDriver(partnerId: string): Promise<void> {
//         try {
//             await this.redisClient.zrem('availableDrivers', partnerId);
//             await this.deleteData(`driverActive:${partnerId}`);
//         } catch (error) {
//             console.error(`RedisService: Error removing driver "${partnerId}":`, error);
//             throw error;
//         }
//     }

//     async isKeyExists(key: string): Promise<boolean> {
//         return (await this.redisClient.exists(key)) === 1;
//     }

//     async findNearestDriver(
//         longitude: number,
//         latitude: number,
//         radiusKm: number,
//         count: number = 1,
//     ): Promise<[Types.ObjectId | null]>  {
//         try {
//             const results = await this.redisClient.georadius(
//                 'availableDrivers',
//                 longitude,
//                 latitude,
//                 radiusKm,
//                 'km',
//                 'WITHDIST',
//                 'ASC',
//                 'COUNT',
//             );

//             if (!results || results.length === 0) {
//                 return [null];
//             }

//             const ans: [Types.ObjectId | null] = results.map((idDist) => {
//                 return idDist[0];
//             })

//             return ans;

//         } catch (error) {
//             console.error("RedisService: Error finding nearest driver:", error);
//             throw error;
//         }
//     }

//     async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
//         await this.updateDriverLocation(partnerId, longitude, latitude);
//     }
// }


// import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
// import { Types } from 'mongoose';
// import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// @ApiTags('Redis Service')
// @Injectable()
// export class RedisService implements OnModuleInit{
//   private readonly logger = new Logger(RedisService.name);

//   private redisClient: any;
//   constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

//   async onModuleInit() {
//       this.redisClient = (this.cacheManager as any)?.store?.client;
//   }

//   @ApiOperation({ summary: 'Set data in Redis with TTL' })
//   @ApiResponse({ status: 200, description: 'Data successfully set' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async setData(key: string, value: string | object, ttl: number): Promise<void> {
//     try {
//       this.logger.log(`Setting data for key: ${key}`);
//       await this.cacheManager.set(key, value, ttl * 1000);
//       this.logger.log(`Data set successfully for key: ${key}`);
//     } catch (error) {
//       this.logger.error(`Error setting data for key "${key}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Get data from Redis' })
//   @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
//   @ApiResponse({ status: 404, description: 'Key not found' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async getData(key: string): Promise<string | null> {
//     try {
//       this.logger.log(`Fetching data for key: ${key}`);
//       const data: string | null = await this.cacheManager.get(key);
//       if (!data) {
//         this.logger.warn(`Key not found: ${key}`);
//       }
//       return data;
//     } catch (error) {
//       this.logger.error(`Error getting data for key "${key}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Delete data from Redis' })
//   @ApiResponse({ status: 200, description: 'Data deleted successfully' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async deleteData(key: string): Promise<void> {
//     try {
//       this.logger.log(`Deleting data for key: ${key}`);
//       await this.cacheManager.del(key);
//       this.logger.log(`Data deleted successfully for key: ${key}`);
//     } catch (error) {
//       this.logger.error(`Error deleting data for key "${key}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Clear entire Redis cache' })
//   @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async resetCache(): Promise<void> {
//     try {
//       this.logger.log('Clearing Redis cache');
//       await this.cacheManager.clear();
//       this.logger.log('Redis cache cleared successfully');
//     } catch (error) {
//       this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Update driver location in Redis GEO set' })
//   @ApiResponse({ status: 200, description: 'Driver location updated' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       this.logger.log(`Updating location for driver: ${partnerId}`);
//       await this.redisClient.geoadd('availableDrivers', longitude, latitude, partnerId);
//       await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300);
//       this.logger.log(`Location updated for driver: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`Error updating driver location for "${partnerId}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Remove driver from Redis GEO set' })
//   @ApiResponse({ status: 200, description: 'Driver removed successfully' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async removeDriver(partnerId: string): Promise<void> {
//     try {
//       this.logger.log(`Removing driver: ${partnerId}`);
//       await this.redisClient.zrem('availableDrivers', partnerId);
//       await this.deleteData(`driverActive:${partnerId}`);
//       this.logger.log(`Driver removed successfully: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`Error removing driver "${partnerId}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Check if key exists in Redis' })
//   @ApiResponse({ status: 200, description: 'Key existence checked' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async isKeyExists(key: string): Promise<boolean> {
//     try {
//       this.logger.log(`Checking existence of key: ${key}`);
//       const exists = (await this.redisClient.exists(key)) === 1;
//       this.logger.log(`Key ${key} exists: ${exists}`);
//       return exists;
//     } catch (error) {
//       this.logger.error(`Error checking key existence "${key}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Find nearest drivers within radius' })
//   @ApiResponse({ status: 200, description: 'Nearest drivers found' })
//   @ApiResponse({ status: 404, description: 'No drivers found' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async findNearestDriver(
//     longitude: number,
//     latitude: number,
//     radiusKm: number,
//     count: number = 1,
//   ): Promise<[Types.ObjectId | null]> {
//     try {
//       this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}km`);
      
//       const results = await this.redisClient.georadius(
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

//       const drivers = results.map(([id]) => new Types.ObjectId(id));
//       this.logger.log(`Found ${drivers.length} nearest drivers`);
      
//       return drivers as [Types.ObjectId | null];
//     } catch (error) {
//       this.logger.error(`Error finding nearest driver: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   @ApiOperation({ summary: 'Add available driver to Redis' })
//   @ApiResponse({ status: 200, description: 'Driver added successfully' })
//   @ApiResponse({ status: 500, description: 'Internal server error' })
//   async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
//     try {
//       this.logger.log(`Adding available driver: ${partnerId}`);
//       await this.updateDriverLocation(partnerId, longitude, latitude);
//       this.logger.log(`Driver added successfully: ${partnerId}`);
//     } catch (error) {
//       this.logger.error(`Error adding available driver "${partnerId}": ${error.message}`, error.stack);
//       throw error;
//     }
//   }
// }

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // For accessing environment variables
import Redis, { Redis as RedisClient } from 'ioredis'; // Import Redis and its type
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Redis Service')
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClient; // Type for the ioredis client

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Redis client...');
    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>('redis.host') || 'localhost',
        port: this.configService.get<number>('redis.port') || 6379,
        lazyConnect: true, 
      });

      // Event listeners for connection status
      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected successfully.');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('Redis client is ready (connected and authenticated).');
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis client error: ${err.message}`, err.stack);
        // It's crucial to handle errors, but ioredis attempts to reconnect automatically.
        // You might decide to throw here based on your error handling strategy.
      });

      this.redisClient.on('close', () => {
        this.logger.warn('Redis client connection closed.');
      });

      // Explicitly connect (if lazyConnect is true)
      await this.redisClient.connect();
      this.logger.log('Redis client connection attempt initiated.');

    } catch (error) {
      this.logger.error(`Error initializing Redis client: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initialize Redis client.');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis client connection...');
    if (this.redisClient && this.redisClient.status === 'ready' || this.redisClient.status === 'connect') {
      await this.redisClient.quit(); // Use quit() to gracefully close connection
      this.logger.log('Redis client connection closed gracefully.');
    } else {
      this.logger.warn('Redis client not connected or already closed during OnModuleDestroy.');
    }
  }

  // --- Helper to ensure client is ready for operations ---
  private async ensureRedisClient(): Promise<RedisClient> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      this.logger.warn(`Redis client not ready. Current status: ${this.redisClient?.status || 'uninitialized'}. Attempting to reconnect.`);
      if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
        // Wait for it to reconnect if it's already in the process
        await new Promise(resolve => this.redisClient.once('ready', resolve));
      } else {
        // If not connecting, try to connect (useful if it was previously disconnected)
        await this.redisClient.connect();
        await new Promise(resolve => this.redisClient.once('ready', resolve)); // Wait for it to be ready
      }
    }
    if (this.redisClient.status !== 'ready') {
      this.logger.error('Redis client is still not ready after connection attempt.');
      throw new InternalServerErrorException('Redis client is not connected or ready.');
    }
    return this.redisClient;
  }


  @ApiOperation({ summary: 'Set data in Redis with TTL' })
  @ApiResponse({ status: 200, description: 'Data successfully set' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async setData(key: string, value: string | object, ttl: number): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Setting data for key: ${key}`);
      // ioredis set takes value as string, so stringify objects
      await client.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value), 'EX', ttl); // TTL in seconds
      this.logger.log(`Data set successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to set data in Redis for key "${key}".`);
    }
  }

  @ApiOperation({ summary: 'Get data from Redis' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getData(key: string): Promise<string | null> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Fetching data for key: ${key}`);
      const data: string | null = await client.get(key);
      if (!data) {
        this.logger.warn(`Key not found: ${key}`);
      }
      // If you stored objects as JSON, you might want to parse it here
      // try {
      //   return data ? JSON.parse(data) : null;
      // } catch (parseError) {
      //   this.logger.error(`Error parsing JSON for key "${key}": ${parseError.message}`);
      //   return data; // Return raw data if parsing fails
      // }
      return data;
    } catch (error) {
      this.logger.error(`Error getting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve data from Redis for key "${key}".`);
    }
  }

  @ApiOperation({ summary: 'Delete data from Redis' })
  @ApiResponse({ status: 200, description: 'Data deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteData(key: string): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Deleting data for key: ${key}`);
      await client.del(key);
      this.logger.log(`Data deleted successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete data from Redis for key "${key}".`);
    }
  }

  @ApiOperation({ summary: 'Clear entire Redis cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resetCache(): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log('Clearing entire Redis database using FLUSHDB...');
      await client.flushdb(); // FLUSHDB command
      this.logger.log('Redis cache cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to clear entire Redis cache.');
    }
  }

  @ApiOperation({ summary: 'Update driver location in Redis GEO set' })
  @ApiResponse({ status: 200, description: 'Driver location updated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Updating location for driver: ${partnerId}`);
      // GEOADD takes member and then longitude, latitude
      await client.geoadd('availableDrivers', longitude, latitude, partnerId);
      await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300); // Reusing setData
      this.logger.log(`Location updated for driver: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error updating driver location for "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to update driver location for "${partnerId}".`);
    }
  }

  @ApiOperation({ summary: 'Remove driver from Redis GEO set' })
  @ApiResponse({ status: 200, description: 'Driver removed successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeDriver(partnerId: string): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Removing driver: ${partnerId}`);
      await client.zrem('availableDrivers', partnerId); // ZREM to remove from sorted set (GEO set)
      await this.deleteData(`driverActive:${partnerId}`); // Delete associated active status
      this.logger.log(`Driver removed successfully: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error removing driver "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to remove driver "${partnerId}".`);
    }
  }

  @ApiOperation({ summary: 'Check if key exists in Redis' })
  @ApiResponse({ status: 200, description: 'Key existence checked' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async isKeyExists(key: string): Promise<boolean> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Checking existence of key: ${key}`);
      const exists = (await client.exists(key)) === 1; // ioredis exists returns 0 or 1
      this.logger.log(`Key ${key} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Error checking key existence "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to check key existence for "${key}".`);
    }
  }

  @ApiOperation({ summary: 'Find nearest drivers within radius' })
  @ApiResponse({ status: 200, description: 'Nearest drivers found' })
  @ApiResponse({ status: 404, description: 'No drivers found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findNearestDriver(
    longitude: number,
    latitude: number,
    radiusKm: number,
    count: number = 1,
  ): Promise<[Types.ObjectId | null]> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}km (count: ${count})`);

      // GEORADIUS command with options
      const results = await client.georadius(
        'availableDrivers',
        longitude,
        latitude,
        radiusKm,
        'km', // units can be 'm', 'km', 'ft', 'mi'
        'WITHDIST', // return distance
        'ASC',      // ascending order by distance
        'COUNT',    // limit the number of results
        count,
      );

      if (!results || results.length === 0) {
        this.logger.warn('No drivers found in the specified radius');
        return [null]; // Return empty array if no drivers found
      }

      // results are typically [ [ 'member', 'distance' ], ... ]
      const drivers = results.map(([id, dist]: [string, string]) => new Types.ObjectId(id));
      this.logger.log(`Found ${drivers.length} nearest drivers`);

      return drivers as [Types.ObjectId | null];
    } catch (error) {
      this.logger.error(`Error finding nearest driver: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to find nearest drivers.`);
    }
  }

  @ApiOperation({ summary: 'Add available driver to Redis' })
  @ApiResponse({ status: 200, description: 'Driver added successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      this.logger.log(`Adding available driver: ${partnerId}`);
      // Reusing updateDriverLocation which already handles client checks and logging
      await this.updateDriverLocation(partnerId, longitude, latitude);
      this.logger.log(`Driver added successfully: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error adding available driver "${partnerId}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to add available driver "${partnerId}".`);
    }
  }
}