import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
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

  async create(guestId: string, dto: CreateReviewDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      include: {
        show: { include: { venue: true } },
        review: true,
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.guestId !== guestId) throw new ForbiddenException('Not your ticket');
    if (ticket.status !== 'COMPLETED' && ticket.status !== 'CHECKED_IN') {
      throw new ForbiddenException('You must attend the show to leave a review');
    }
    if (ticket.review) {
      throw new ConflictException('You already reviewed this show');
    }

    const review = await this.prisma.review.create({
      data: {
        showId: ticket.showId,
        hostId: ticket.show.venue.hostId,
        guestId,
        ticketId: dto.ticketId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        guest: { select: { id: true, username: true } },
        show: { select: { movieTitle: true } },
      },
    });

    // Invalidate review-related caches
    await Promise.all([
      this.redisService.del(`reviews:host:${ticket.show.venue.hostId}`),
      this.redisService.del(`reviews:host:${ticket.show.venue.hostId}:rating`),
      this.redisService.del(`reviews:show:${ticket.showId}`),
    ]);

    return review;
  }

  async findByHost(hostId: string) {
    const cacheKey = `reviews:host:${hostId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const reviews = await this.prisma.review.findMany({
      where: { hostId },
      include: {
        guest: { select: { id: true, username: true } },
        show: { select: { movieTitle: true, moviePoster: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(reviews), 600);
    return reviews;
  }

  async getHostRating(hostId: string) {
    const cacheKey = `reviews:host:${hostId}:rating`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const result = await this.prisma.review.aggregate({
      where: { hostId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const rating = {
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.rating,
    };

    await this.redisService.set(cacheKey, JSON.stringify(rating), 600);
    return rating;
  }

  async findByShow(showId: string) {
    const cacheKey = `reviews:show:${showId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const reviews = await this.prisma.review.findMany({
      where: { showId },
      include: {
        guest: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(reviews), 600);
    return reviews;
  }
}
