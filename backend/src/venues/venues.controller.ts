import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVenueDto) {
    return this.venuesService.create(userId, dto);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  findMyVenues(@CurrentUser('id') userId: string) {
    return this.venuesService.findAllByHost(userId);
  }

  @Get('nearby')
  findNearby(
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
    return this.venuesService.findNearby(lat, lng, r);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.venuesService.remove(id, userId);
  }
}
