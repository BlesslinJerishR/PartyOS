import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookTicketDto } from './dto/book-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async book(guestId: string, dto: BookTicketDto) {
    const show = await this.prisma.show.findUnique({
      where: { id: dto.showId },
      include: { venue: true },
    });

    if (!show) throw new NotFoundException('Show not found');
    if (show.status === 'CANCELLED') {
      throw new ConflictException('Show has been cancelled');
    }
    if (show.status === 'COMPLETED') {
      throw new ConflictException('Show has already ended');
    }

    const existingTicket = await this.prisma.ticket.findUnique({
      where: {
        showId_seatId: { showId: dto.showId, seatId: dto.seatId },
      },
    });

    if (existingTicket) {
      throw new ConflictException('Seat is already booked');
    }

    const seat = await this.prisma.seat.findUnique({
      where: { id: dto.seatId },
    });

    if (!seat) throw new NotFoundException('Seat not found');

    const price = show.isFree ? 0 : show.price;

    return this.prisma.ticket.create({
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
  }

  async findMyTickets(guestId: string) {
    return this.prisma.ticket.findMany({
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
      throw new ConflictException('Not your ticket');
    }
    if (ticket.status !== 'BOOKED') {
      throw new ConflictException('Ticket cannot be cancelled');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async checkIn(id: string, hostId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { show: { include: { venue: true } } },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.show.venue.hostId !== hostId) {
      throw new ConflictException('Not your show');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
    });
  }

  async markCompleted(showId: string) {
    return this.prisma.ticket.updateMany({
      where: { showId, status: 'CHECKED_IN' },
      data: { status: 'COMPLETED' },
    });
  }
}
