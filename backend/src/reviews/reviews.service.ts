import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.review.create({
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
  }

  async findByHost(hostId: string) {
    return this.prisma.review.findMany({
      where: { hostId },
      include: {
        guest: { select: { id: true, username: true } },
        show: { select: { movieTitle: true, moviePoster: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHostRating(hostId: string) {
    const result = await this.prisma.review.aggregate({
      where: { hostId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.rating,
    };
  }

  async findByShow(showId: string) {
    return this.prisma.review.findMany({
      where: { showId },
      include: {
        guest: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
