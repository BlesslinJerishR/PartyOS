import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    return this.locationService.getNearbyShowsMap(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : undefined,
    );
  }
}
