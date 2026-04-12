import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { BookTicketDto } from './dto/book-ticket.dto';
import { BookMultipleTicketsDto } from './dto/book-multiple-tickets.dto';

@Injectable()
export class TicketsService {
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

  async book(guestId: string, dto: BookTicketDto) {
    return this.prisma.$transaction(async (tx) => {
      const show = await tx.show.findUnique({
        where: { id: dto.showId },
        include: { venue: true },
      });

      if (!show) throw new NotFoundException('Show not found');

      if (show.venue.hostId === guestId) {
        throw new BadRequestException('Hosts cannot book tickets for their own shows');
      }

      if (show.status === 'CANCELLED') {
        throw new ConflictException('Show has been cancelled');
      }
      if (show.status === 'COMPLETED') {
        throw new ConflictException('Show has already ended');
      }

      if (show.isPrivate && show.password) {
        if (!dto.password) {
          throw new ForbiddenException('Password required for this private show');
        }
        const isValid = await bcrypt.compare(dto.password, show.password);
        if (!isValid) {
          throw new ForbiddenException('Incorrect show password');
        }
      }

      const seat = await tx.seat.findUnique({
        where: { id: dto.seatId },
      });

      if (!seat) throw new NotFoundException('Seat not found');
      if (seat.venueId !== show.venueId) {
        throw new BadRequestException('Seat does not belong to this venue');
      }

      const existingTicket = await tx.ticket.findUnique({
        where: {
          showId_seatId: { showId: dto.showId, seatId: dto.seatId },
        },
      });

      if (existingTicket && existingTicket.status !== 'CANCELLED') {
        throw new ConflictException('Seat is already booked');
      }

      const price = show.isFree ? 0 : show.price;

      const ticket = await tx.ticket.create({
        data: {
          showId: dto.showId,
          seatId: dto.seatId,
          guestId,
          price,
        },
        include: {
          show: {
            include: {
              venue: {
                include: {
                  host: { select: { id: true, username: true } },
                },
              },
            },
          },
          seat: true,
        },
      });

      // Strip show password from response
      const { password: _, ...showWithoutPassword } = ticket.show as any;
      return { ...ticket, show: showWithoutPassword };
    });
  }

  async bookMultiple(guestId: string, dto: BookMultipleTicketsDto) {
    const uniqueSeatIds = [...new Set(dto.seatIds)];

    return this.prisma.$transaction(async (tx) => {
      const show = await tx.show.findUnique({
        where: { id: dto.showId },
        include: { venue: true },
      });

      if (!show) throw new NotFoundException('Show not found');

      if (show.venue.hostId === guestId) {
        throw new BadRequestException('Hosts cannot book tickets for their own shows');
      }

      if (show.status === 'CANCELLED') {
        throw new ConflictException('Show has been cancelled');
      }
      if (show.status === 'COMPLETED') {
        throw new ConflictException('Show has already ended');
      }

      if (show.isPrivate && show.password) {
        if (!dto.password) {
          throw new ForbiddenException('Password required for this private show');
        }
        const isValid = await bcrypt.compare(dto.password, show.password);
        if (!isValid) {
          throw new ForbiddenException('Incorrect show password');
        }
      }

      // Validate all seats exist and belong to the venue
      const seats = await tx.seat.findMany({
        where: { id: { in: uniqueSeatIds } },
      });

      if (seats.length !== uniqueSeatIds.length) {
        throw new NotFoundException('One or more seats not found');
      }

      const invalidSeats = seats.filter((s) => s.venueId !== show.venueId);
      if (invalidSeats.length > 0) {
        throw new BadRequestException('One or more seats do not belong to this venue');
      }

      // Check none are already booked
      const existingTickets = await tx.ticket.findMany({
        where: {
          showId: dto.showId,
          seatId: { in: uniqueSeatIds },
          status: { not: 'CANCELLED' },
        },
      });

      if (existingTickets.length > 0) {
        const bookedLabels = existingTickets.map((t) => t.seatId);
        throw new ConflictException(
          `Some seats are already booked: ${bookedLabels.join(', ')}`,
        );
      }

      const price = show.isFree ? 0 : show.price;

      const tickets = await Promise.all(
        uniqueSeatIds.map((seatId) =>
          tx.ticket.create({
            data: {
              showId: dto.showId,
              seatId,
              guestId,
              price,
            },
            include: {
              show: {
                include: {
                  venue: {
                    include: {
                      host: { select: { id: true, username: true } },
                    },
                  },
                },
              },
              seat: true,
            },
          }),
        ),
      );

      // Strip show password from response
      return tickets.map((ticket) => {
        const { password: _, ...showWithoutPassword } = ticket.show as any;
        return { ...ticket, show: showWithoutPassword };
      });
    });
  }

  async findMyTickets(guestId: string) {
    const cacheKey = `tickets:guest:${guestId}`;
    const cached = this.safeParse(await this.redisService.get(cacheKey));
    if (cached) return cached;

    const tickets = await this.prisma.ticket.findMany({
      where: { guestId },
      include: {
        show: {
          include: {
            venue: {
              include: {
                host: { select: { id: true, username: true } },
              },
            },
          },
        },
        seat: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(tickets), 120);
    return tickets;
  }

  async findByShow(showId: string) {
    return this.prisma.ticket.findMany({
      where: { showId },
      include: {
        guest: { select: { id: true, username: true } },
        seat: true,
      },
    });
  }

  async cancel(id: string, guestId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.guestId !== guestId) {
      throw new ForbiddenException('Not your ticket');
    }
    if (ticket.status !== 'BOOKED') {
      throw new ConflictException(
        `Cannot cancel a ticket with status: ${ticket.status}`,
      );
    }

    const result = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.redisService.del(`tickets:guest:${guestId}`);
    return result;
  }

  async checkIn(id: string, hostId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { show: { include: { venue: true } } },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.show.venue.hostId !== hostId) {
      throw new ForbiddenException('Not your show');
    }
    if (ticket.status !== 'BOOKED') {
      throw new ConflictException(
        `Cannot check in a ticket with status: ${ticket.status}`,
      );
    }

    const result = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
    });

    await this.redisService.del(`tickets:guest:${ticket.guestId}`);
    return result;
  }

  async markCompleted(showId: string) {
    return this.prisma.ticket.updateMany({
      where: { showId, status: 'CHECKED_IN' },
      data: { status: 'COMPLETED' },
    });
  }
}
