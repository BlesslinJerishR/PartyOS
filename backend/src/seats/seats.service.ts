import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { BatchCreateSeatsDto } from './dto/batch-create-seats.dto';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(hostId: string, dto: CreateSeatDto) {
    await this.verifyVenueOwnership(dto.venueId, hostId);

    return this.prisma.seat.create({
      data: {
        venueId: dto.venueId,
        type: dto.type,
        label: dto.label,
        row: dto.row,
        col: dto.col,
        capacity: dto.capacity || 1,
      },
    });
  }

  async batchCreate(hostId: string, dto: BatchCreateSeatsDto) {
    await this.verifyVenueOwnership(dto.venueId, hostId);

    await this.prisma.seat.deleteMany({ where: { venueId: dto.venueId } });

    return this.prisma.seat.createMany({
      data: dto.seats.map((seat) => ({
        venueId: dto.venueId,
        type: seat.type,
        label: seat.label,
        row: seat.row,
        col: seat.col,
        capacity: seat.capacity || 1,
      })),
    });
  }

  async findByVenue(venueId: string) {
    return this.prisma.seat.findMany({
      where: { venueId },
      orderBy: [{ row: 'asc' }, { col: 'asc' }],
    });
  }

  async remove(id: string, hostId: string) {
    const seat = await this.prisma.seat.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!seat) throw new NotFoundException('Seat not found');
    if (seat.venue.hostId !== hostId) throw new ForbiddenException();

    return this.prisma.seat.delete({ where: { id } });
  }

  private async verifyVenueOwnership(venueId: string, hostId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();
  }
}
