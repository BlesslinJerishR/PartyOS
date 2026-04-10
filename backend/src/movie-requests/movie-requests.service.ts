import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

  async create(guestId: string, dto: CreateMovieRequestDto) {
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
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

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
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

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
