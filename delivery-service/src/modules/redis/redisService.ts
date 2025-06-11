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


import { Inject, Injectable} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class RedisService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache){}

    private get redisClient(): any {
        return (this.cacheManager as any).store.client;
    }

    async setData(key: string, value: string | object, ttl: number): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttl * 1000);
        } catch (error) {
            console.error(`RedisService: Error setting data for key "${key}":`, error);
            throw error;
        }
    }

    async getData(key: string): Promise<string | null> {
        try {
            return await this.cacheManager.get(key);
        } catch (error) {
            console.error(`RedisService: Error getting data for key "${key}":`, error);
            throw error;
        }
    }

    async deleteData(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
        } catch (error) {
            console.error(`RedisService: Error deleting data for key "${key}":`, error);
            throw error;
        }
    }

    async resetCache(): Promise<void> {
        try {
            await this.cacheManager.clear();
        } catch (error) {
            console.error("RedisService: Error clearing cache:", error);
            throw error;
        }
    }

    async updateDriverLocation(partnerId: string, longitude: number, latitude: number): Promise<void> {
        try {
            await this.redisClient.geoadd('availableDrivers', longitude, latitude, partnerId);
            await this.setData(`driverActive:${partnerId}`, { longitude, latitude, timestamp: Date.now() }, 300);
        } catch (error) {
            console.error(`RedisService: Error updating driver location for "${partnerId}":`, error);
            throw error;
        }
    }

    async removeDriver(partnerId: string): Promise<void> {
        try {
            await this.redisClient.zrem('availableDrivers', partnerId);
            await this.deleteData(`driverActive:${partnerId}`);
        } catch (error) {
            console.error(`RedisService: Error removing driver "${partnerId}":`, error);
            throw error;
        }
    }

    async isKeyExists(key: string): Promise<boolean> {
        return (await this.redisClient.exists(key)) === 1;
    }

    async findNearestDriver(
        longitude: number,
        latitude: number,
        radiusKm: number,
        count: number = 1,
    ): Promise<[Types.ObjectId | null]>  {
        try {
            const results = await this.redisClient.georadius(
                'availableDrivers',
                longitude,
                latitude,
                radiusKm,
                'km',
                'WITHDIST',
                'ASC',
                'COUNT',
            );

            if (!results || results.length === 0) {
                return [null];
            }

            const ans: [Types.ObjectId | null] = results.map((idDist) => {
                return idDist[0];
            })

            return ans;

        } catch (error) {
            console.error("RedisService: Error finding nearest driver:", error);
            throw error;
        }
    }

    async addAvailableDriver(partnerId: string, longitude: number, latitude: number): Promise<void> {
        await this.updateDriverLocation(partnerId, longitude, latitude);
    }
}



