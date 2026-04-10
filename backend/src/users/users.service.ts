import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private safeParse<T>(json: string | null): T | null {
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  async setRole(userId: string, role: UserRole) {
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    await Promise.all([
      this.redisService.del(`users:profile:${userId}`),
      this.redisService.del(`jwt:user:${userId}`),
    ]);
    return result;
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude },
      select: { id: true, username: true, latitude: true, longitude: true },
    });
    await this.redisService.del(`users:profile:${userId}`);
    await this.redisService.delPattern('users:nearby:*');
    return result;
  }

  async getProfile(userId: string) {
    const cacheKey = `users:profile:${userId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    if (!profile) throw new NotFoundException('User not found');

    await this.redisService.set(cacheKey, JSON.stringify(profile), 600);
    return profile;
  }

  async getNearbyHosts(latitude: number, longitude: number, radiusKm: number = 50) {
    const clampedRadius = Math.min(Math.max(radiusKm, 1), 500);
    const cacheKey = `users:nearby:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${clampedRadius}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const hosts = await this.prisma.user.findMany({
      where: {
        role: 'HOST',
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        username: true,
        latitude: true,
        longitude: true,
        venues: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const result = hosts.filter((host) => {
      if (!host.latitude || !host.longitude) return false;
      const distance = this.calculateDistance(
        latitude,
        longitude,
        host.latitude,
        host.longitude,
      );
      return distance <= clampedRadius;
    });

    await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async searchHosts(query: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'HOST',
        username: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, username: true },
      take: 10,
    });
  }
}
