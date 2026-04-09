import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSnackDto } from './dto/create-snack.dto';
import { UpdateSnackDto } from './dto/update-snack.dto';

@Injectable()
export class SnacksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(hostId: string, dto: CreateSnackDto) {
    await this.verifyVenueOwnership(dto.venueId, hostId);

    return this.prisma.snack.create({
      data: {
        venueId: dto.venueId,
        name: dto.name,
        description: dto.description,
        price: dto.price ?? 0,
        available: dto.available ?? true,
      },
    });
  }

  async findByVenue(venueId: string) {
    return this.prisma.snack.findMany({
      where: { venueId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, hostId: string, dto: UpdateSnackDto) {
    const snack = await this.prisma.snack.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!snack) throw new NotFoundException('Snack not found');
    if (snack.venue.hostId !== hostId) throw new ForbiddenException();

    return this.prisma.snack.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, hostId: string) {
    const snack = await this.prisma.snack.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!snack) throw new NotFoundException('Snack not found');
    if (snack.venue.hostId !== hostId) throw new ForbiddenException();

    return this.prisma.snack.delete({ where: { id } });
  }

  private async verifyVenueOwnership(venueId: string, hostId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();
  }
}
