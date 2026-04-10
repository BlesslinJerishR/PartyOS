import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async setRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true },
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude },
      select: { id: true, username: true, latitude: true, longitude: true },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
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
  }

  async getNearbyHosts(latitude: number, longitude: number, radiusKm: number = 50) {
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

    return hosts.filter((host) => {
      if (!host.latitude || !host.longitude) return false;
      const distance = this.calculateDistance(
        latitude,
        longitude,
        host.latitude,
        host.longitude,
      );
      return distance <= radiusKm;
    });
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
