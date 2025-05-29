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

import { Inject, Injectable} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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

    async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
        try {
            await this.redisClient.geoadd('available_drivers', lng, lat, driverId);
            await this.setData(`driver_active:${driverId}`, { lat, lng, timestamp: Date.now() }, 300);
        } catch (error) {
            console.error(`RedisService: Error updating driver location for "${driverId}":`, error);
            throw error;
        }
    }

    async removeDriver(driverId: string): Promise<void> {
        try {
            await this.redisClient.zrem('available_drivers', driverId);
            await this.deleteData(`driver_active:${driverId}`);
        } catch (error) {
            console.error(`RedisService: Error removing driver "${driverId}":`, error);
            throw error;
        }
    }

    async findNearestDriver(
        lat: number,
        lng: number,
        radiusKm: number,
        count: number = 1,
        skipDriverIds: string[] = []
    ): Promise<[string | null, number | null]> {
        try {
            const results = await this.redisClient.georadius(
                'available_drivers',
                lng,
                lat,
                radiusKm,
                'km',
                'WITHDIST',
                'ASC',
                'COUNT',
                count + skipDriverIds.length
            );

            if (!results || results.length === 0) {
                return [null, null];
            }

            for (const result of results) {
                const driverId = result[0];
                const distance = parseFloat(result[1]);

                if (skipDriverIds.includes(driverId)) {
                    continue;
                }

                const driverActiveData = await this.getData(`driver_active:${driverId}`);

                if (driverActiveData) {
                    return [driverId, distance];
                } else {
                    console.log(`RedisService: Driver ${driverId} found but not active (expired). Removing from geo set.`);
                    await this.removeDriver(driverId);
                    skipDriverIds.push(driverId);
                    return this.findNearestDriver(lat, lng, radiusKm, count, skipDriverIds);
                }
            }

            return [null, null];

        } catch (error) {
            console.error("RedisService: Error finding nearest driver:", error);
            throw error;
        }
    }

    async addAvailableDriver(driverId: string, lat: number, lng: number): Promise<void> {
        await this.updateDriverLocation(driverId, lat, lng);
    }
}