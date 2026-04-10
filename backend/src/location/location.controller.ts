import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationService } from './location.service';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('map')
  getNearbyShowsMap(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }
    const r = radius ? parseFloat(radius) : undefined;
    if (r !== undefined && (isNaN(r) || r <= 0 || r > 500)) {
      throw new BadRequestException('Radius must be between 0 and 500 km');
    }
    return this.locationService.getNearbyShowsMap(lat, lng, r);
  }
}
