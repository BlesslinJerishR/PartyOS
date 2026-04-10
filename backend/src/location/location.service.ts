import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getNearbyShowsMap(latitude: number, longitude: number, radiusKm: number = 50) {
    const clampedRadius = Math.min(Math.max(radiusKm, 1), 500);
    const cacheKey = `location:map:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${clampedRadius}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        await this.redisService.del(cacheKey);
      }
    }

    const now = new Date();

    const [nowPlaying, upcoming] = await Promise.all([
      this.prisma.show.findMany({
        where: {
          status: 'NOW_PLAYING',
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              host: { select: { id: true, username: true } },
            },
          },
        },
      }),
      this.prisma.show.findMany({
        where: {
          status: 'SCHEDULED',
          startTime: { gt: now },
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              host: { select: { id: true, username: true } },
            },
          },
        },
      }),
    ]);

    const filterByDistance = (shows: any[]) =>
      shows.filter((show) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          show.venue.latitude,
          show.venue.longitude,
        );
        return distance <= clampedRadius;
      });

    const result = {
      nowPlaying: filterByDistance(nowPlaying).map((show) => ({
        id: show.id,
        movieTitle: show.movieTitle,
        moviePoster: show.moviePoster,
        startTime: show.startTime,
        endTime: show.endTime,
        isFree: show.isFree,
        price: show.price,
        venue: show.venue,
      })),
      upcoming: filterByDistance(upcoming).map((show) => ({
        id: show.id,
        movieTitle: show.movieTitle,
        moviePoster: show.moviePoster,
        startTime: show.startTime,
        endTime: show.endTime,
        isFree: show.isFree,
        price: show.price,
        venue: show.venue,
      })),
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), 120);
    return result;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
