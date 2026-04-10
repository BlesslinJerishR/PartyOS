import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MovieRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateMovieRequestDto } from './dto/create-movie-request.dto';

@Injectable()
export class MovieRequestsService {
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

  async create(guestId: string, dto: CreateMovieRequestDto) {
    if (guestId === dto.hostId) {
      throw new BadRequestException('Cannot send a movie request to yourself');
    }

    const host = await this.prisma.user.findUnique({
      where: { id: dto.hostId },
    });
    if (!host || host.role !== 'HOST') {
      throw new NotFoundException('Host not found');
    }

    const request = await this.prisma.movieRequest.create({
      data: {
        guestId,
        hostId: dto.hostId,
        tmdbMovieId: dto.tmdbMovieId,
        movieTitle: dto.movieTitle,
      },
      include: {
        host: { select: { id: true, username: true } },
        guest: { select: { id: true, username: true } },
      },
    });

    await Promise.all([
      this.redisService.del(`movie-requests:host:${dto.hostId}`),
      this.redisService.del(`movie-requests:guest:${guestId}`),
    ]);
    return request;
  }

  async findByHost(hostId: string) {
    const cacheKey = `movie-requests:host:${hostId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const requests = await this.prisma.movieRequest.findMany({
      where: { hostId },
      include: {
        guest: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(requests), 300);
    return requests;
  }

  async findByGuest(guestId: string) {
    const cacheKey = `movie-requests:guest:${guestId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const requests = await this.prisma.movieRequest.findMany({
      where: { guestId },
      include: {
        host: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(requests), 300);
    return requests;
  }

  async updateStatus(
    id: string,
    hostId: string,
    status: MovieRequestStatus,
  ) {
    const request = await this.prisma.movieRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.hostId !== hostId) throw new ForbiddenException();

    const updated = await this.prisma.movieRequest.update({
      where: { id },
      data: { status },
      include: {
        guest: { select: { id: true, username: true } },
      },
    });

    await Promise.all([
      this.redisService.del(`movie-requests:host:${hostId}`),
      this.redisService.del(`movie-requests:guest:${request.guestId}`),
    ]);
    return updated;
  }
}
