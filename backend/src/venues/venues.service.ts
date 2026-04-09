import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(hostId: string, dto: CreateVenueDto) {
    return this.prisma.venue.create({
      data: {
        hostId,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        screenType: dto.screenType,
      },
      include: { seats: true },
    });
  }

  async findAllByHost(hostId: string) {
    return this.prisma.venue.findMany({
      where: { hostId },
      include: { seats: true, _count: { select: { shows: true } } },
    });
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
        snacks: true,
        host: { select: { id: true, username: true } },
      },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: string, hostId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();

    return this.prisma.venue.update({
      where: { id },
      data: dto,
      include: { seats: true },
    });
  }

  async remove(id: string, hostId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.hostId !== hostId) throw new ForbiddenException();

    return this.prisma.venue.delete({ where: { id } });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 50) {
    const venues = await this.prisma.venue.findMany({
      include: {
        host: { select: { id: true, username: true } },
        _count: { select: { seats: true, shows: true } },
      },
    });

    return venues.filter((venue) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        venue.latitude,
        venue.longitude,
      );
      return distance <= radiusKm;
    }).map((venue) => ({
      ...venue,
      distance: this.calculateDistance(
        latitude,
        longitude,
        venue.latitude,
        venue.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
