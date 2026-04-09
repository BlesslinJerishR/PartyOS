import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MovieRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieRequestDto } from './dto/create-movie-request.dto';

@Injectable()
export class MovieRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(guestId: string, dto: CreateMovieRequestDto) {
    return this.prisma.movieRequest.create({
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
  }

  async findByHost(hostId: string) {
    return this.prisma.movieRequest.findMany({
      where: { hostId },
      include: {
        guest: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGuest(guestId: string) {
    return this.prisma.movieRequest.findMany({
      where: { guestId },
      include: {
        host: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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

    return this.prisma.movieRequest.update({
      where: { id },
      data: { status },
      include: {
        guest: { select: { id: true, username: true } },
      },
    });
  }
}
