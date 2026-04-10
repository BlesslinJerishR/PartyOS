import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateSnackDto } from './dto/create-snack.dto';
import { UpdateSnackDto } from './dto/update-snack.dto';

@Injectable()
export class SnacksService {
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

  async create(hostId: string, dto: CreateSnackDto) {
    await this.verifyVenueOwnership(dto.venueId, hostId);

    const snack = await this.prisma.snack.create({
      data: {
        venueId: dto.venueId,
        name: dto.name,
        description: dto.description,
        price: dto.price ?? 0,
        available: dto.available ?? true,
      },
    });

    await this.redisService.del(`snacks:venue:${dto.venueId}`);
    return snack;
  }

  async findByVenue(venueId: string) {
    const cacheKey = `snacks:venue:${venueId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const snacks = await this.prisma.snack.findMany({
      where: { venueId },
      orderBy: { name: 'asc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(snacks), 600);
    return snacks;
  }

  async update(id: string, hostId: string, dto: UpdateSnackDto) {
    const snack = await this.prisma.snack.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!snack) throw new NotFoundException('Snack not found');
    if (snack.venue.hostId !== hostId) throw new ForbiddenException();

    const updated = await this.prisma.snack.update({
      where: { id },
      data: dto,
    });

    await this.redisService.del(`snacks:venue:${snack.venueId}`);
    return updated;
  }

  async remove(id: string, hostId: string) {
    const snack = await this.prisma.snack.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!snack) throw new NotFoundException('Snack not found');
    if (snack.venue.hostId !== hostId) throw new ForbiddenException();

    const deleted = await this.prisma.snack.delete({ where: { id } });
    await this.redisService.del(`snacks:venue:${snack.venueId}`);
    return deleted;
  }

  private async verifyVenueOwnership(venueId: string, hostId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();
  }
}
