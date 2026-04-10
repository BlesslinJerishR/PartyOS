import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';

@Injectable()
export class ShowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @InjectQueue('shows') private readonly showsQueue: Queue,
  ) {}

  private stripPassword<T extends Record<string, any>>(show: T): Omit<T, 'password'> {
    if (!show) return show;
    const { password, ...rest } = show;
    return rest as Omit<T, 'password'>;
  }

  private stripPasswords<T extends Record<string, any>>(shows: T[]): Omit<T, 'password'>[] {
    return shows.map((s) => this.stripPassword(s));
  }

  async create(hostId: string, dto: CreateShowDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();

    const hashedPassword =
      dto.isPrivate && dto.password
        ? await bcrypt.hash(dto.password, 10)
        : null;

    const show = await this.prisma.show.create({
      data: {
        venueId: dto.venueId,
        tmdbMovieId: dto.tmdbMovieId,
        movieTitle: dto.movieTitle,
        moviePoster: dto.moviePoster,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        isFree: dto.isFree ?? false,
        price: dto.price ?? 0,
        isPrivate: dto.isPrivate ?? false,
        password: hashedPassword,
      },
      include: {
        venue: {
          include: {
            host: { select: { id: true, username: true } },
          },
        },
      },
    });

    const startDelay = new Date(dto.startTime).getTime() - Date.now();
    if (startDelay > 0) {
      await this.showsQueue.add(
        'update-status',
        { showId: show.id, status: 'NOW_PLAYING' },
        { delay: startDelay },
      );
    }

    const endDelay = new Date(dto.endTime).getTime() - Date.now();
    if (endDelay > 0) {
      await this.showsQueue.add(
        'update-status',
        { showId: show.id, status: 'COMPLETED' },
        { delay: endDelay },
      );
    }

    await this.redisService.delPattern('shows:*');
    return this.stripPassword(show);
  }

  async findNowPlaying(latitude?: number, longitude?: number) {
    const cacheKey = `shows:now_playing:${latitude}:${longitude}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const shows = await this.prisma.show.findMany({
      where: {
        status: 'NOW_PLAYING',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        venue: {
          include: {
            host: { select: { id: true, username: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(shows), 300);
    return shows;
  }

  async findUpcoming(latitude?: number, longitude?: number) {
    const cacheKey = `shows:upcoming:${latitude}:${longitude}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const shows = await this.prisma.show.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { gt: now },
      },
      include: {
        venue: {
          include: {
            host: { select: { id: true, username: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(shows), 300);
    return shows;
  }

  async findByHost(hostId: string) {
    return this.prisma.show.findMany({
      where: { venue: { hostId } },
      include: {
        venue: true,
        _count: { select: { tickets: true, reviews: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findOne(id: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: {
        venue: {
          include: {
            host: { select: { id: true, username: true } },
            seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
            snacks: { where: { available: true } },
          },
        },
        tickets: {
          select: { seatId: true, status: true },
        },
        reviews: {
          include: {
            guest: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!show) throw new NotFoundException('Show not found');
    return this.stripPassword(show);
  }

  async update(id: string, hostId: string, dto: UpdateShowDto) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: { venue: true },
    });
    if (!show) throw new NotFoundException('Show not found');
    if (show.venue.hostId !== hostId) throw new ForbiddenException();

    const updateData: any = {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    };

    // Handle password for private shows
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete updateData.password;
    }
    if (dto.isPrivate === false) {
      updateData.password = null;
    }

    const result = await this.prisma.show.update({
      where: { id },
      data: updateData,
    });

    await this.redisService.delPattern('shows:*');
    return this.stripPassword(result);
  }

  async cancel(id: string, hostId: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: { venue: true },
    });
    if (!show) throw new NotFoundException('Show not found');
    if (show.venue.hostId !== hostId) throw new ForbiddenException();

    const result = await this.prisma.show.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.redisService.delPattern('shows:*');
    return result;
  }

  async getMapMarkers() {
    const cached = await this.redisService.get('shows:markers');
    if (cached) return JSON.parse(cached);

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
              latitude: true,
              longitude: true,
              host: { select: { username: true } },
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
              latitude: true,
              longitude: true,
              host: { select: { username: true } },
            },
          },
        },
      }),
    ]);

    const markers = { nowPlaying, upcoming };
    await this.redisService.set('shows:markers', JSON.stringify(markers), 120);
    return markers;
  }
}
