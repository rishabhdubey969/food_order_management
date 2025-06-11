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


import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Redis Service')
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private get redisClient(): any {
    return (this.cacheManager as any).store.client;
  }

  @ApiOperation({ summary: 'Set data in Redis with TTL' })
  @ApiResponse({ status: 200, description: 'Data successfully set' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async setData(key: string, value: string | object, ttl: number): Promise<void> {
    try {
      this.logger.log(`Setting data for key: ${key}`);
      await this.cacheManager.set(key, value, ttl * 1000);
      this.logger.log(`Data set successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting data for key "${key}": ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get data from Redis' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getData(key: string): Promise<string | null> {
    try {
      this.logger.log(`Fetching data for key: ${key}`);
      const data: string | null = await this.cacheManager.get(key);
      if (!data) {
        this.logger.warn(`Key not found: ${key}`);
      }
      return data;
    } catch (error) {
      this.logger.error(`Error getting data for key "${key}": ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Delete data from Redis' })
  @ApiResponse({ status: 200, description: 'Data deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteData(key: string): Promise<void> {
    try {
      this.logger.log(`Deleting data for key: ${key}`);
      await this.cacheManager.del(key);
      this.logger.log(`Data deleted successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting data for key "${key}": ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Clear entire Redis cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resetCache(): Promise<void> {
    try {
      this.logger.log('Clearing Redis cache');
      await this.cacheManager.clear();
      this.logger.log('Redis cache cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Update driver location in Redis GEO set' })
  @ApiResponse({ status: 200, description: 'Driver location updated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      this.logger.log(`Updating location for driver: ${partnerId}`);
      await this.redisClient.geoadd('availableDrivers', longitude, latitude, partnerId);
      await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300);
      this.logger.log(`Location updated for driver: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error updating driver location for "${partnerId}": ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Remove driver from Redis GEO set' })
  @ApiResponse({ status: 200, description: 'Driver removed successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeDriver(partnerId: string): Promise<void> {
    try {
      this.logger.log(`Removing driver: ${partnerId}`);
      await this.redisClient.zrem('availableDrivers', partnerId);
      await this.deleteData(`driverActive:${partnerId}`);
      this.logger.log(`Driver removed successfully: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error removing driver "${partnerId}": ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Check if key exists in Redis' })
  @ApiResponse({ status: 200, description: 'Key existence checked' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async isKeyExists(key: string): Promise<boolean> {
    try {
      this.logger.log(`Checking existence of key: ${key}`);
      const exists = (await this.redisClient.exists(key)) === 1;
      this.logger.log(`Key ${key} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Error checking key existence "${key}": ${error.message}`, error.stack);
      throw error;
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
      this.logger.log(`Finding nearest drivers at (${longitude}, ${latitude}) within ${radiusKm}km`);
      
      const results = await this.redisClient.georadius(
        'availableDrivers',
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC',
        'COUNT',
        count,
      );

      if (!results || results.length === 0) {
        this.logger.warn('No drivers found in the specified radius');
        return [null];
      }

      const drivers = results.map(([id]) => new Types.ObjectId(id));
      this.logger.log(`Found ${drivers.length} nearest drivers`);
      
      return drivers as [Types.ObjectId | null];
    } catch (error) {
      this.logger.error(`Error finding nearest driver: ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Add available driver to Redis' })
  @ApiResponse({ status: 200, description: 'Driver added successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
    try {
      this.logger.log(`Adding available driver: ${partnerId}`);
      await this.updateDriverLocation(partnerId, longitude, latitude);
      this.logger.log(`Driver added successfully: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error adding available driver "${partnerId}": ${error.message}`, error.stack);
      throw error;
    }
  }
}

