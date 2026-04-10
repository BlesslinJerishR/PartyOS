import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
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

  async create(hostId: string, dto: CreateVenueDto) {
    const venue = await this.prisma.venue.create({
      data: {
        hostId,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        screenType: dto.screenType,
      },
      include: { seats: true },
    });

    await this.redisService.delPattern('venues:*');
    return venue;
  }

  async findAllByHost(hostId: string) {
    const cacheKey = `venues:host:${hostId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const venues = await this.prisma.venue.findMany({
      where: { hostId },
      include: { seats: true, _count: { select: { shows: true } } },
    });

    await this.redisService.set(cacheKey, JSON.stringify(venues), 300);
    return venues;
  }

  async findOne(id: string) {
    const cacheKey = `venues:detail:${id}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
        snacks: true,
        host: { select: { id: true, username: true } },
      },
    });

    if (!venue) throw new NotFoundException('Venue not found');

    await this.redisService.set(cacheKey, JSON.stringify(venue), 600);
    return venue;
  }

  async update(id: string, hostId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();

    const result = await this.prisma.venue.update({
      where: { id },
      data: dto,
      include: { seats: true },
    });

    await this.redisService.delPattern('venues:*');
    return result;
  }

  async remove(id: string, hostId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();

    const result = await this.prisma.venue.delete({ where: { id } });
    await this.redisService.delPattern('venues:*');
    return result;
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 50) {
    const clampedRadius = Math.min(Math.max(radiusKm, 1), 500);
    const cacheKey = `venues:nearby:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${clampedRadius}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const venues = await this.prisma.venue.findMany({
      include: {
        host: { select: { id: true, username: true } },
        _count: { select: { seats: true, shows: true } },
      },
    });

    const result = venues
      .map((venue) => ({
        ...venue,
        distance: this.calculateDistance(
          latitude,
          longitude,
          venue.latitude,
          venue.longitude,
        ),
      }))
      .filter((venue) => venue.distance <= clampedRadius)
      .sort((a, b) => a.distance - b.distance);

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
