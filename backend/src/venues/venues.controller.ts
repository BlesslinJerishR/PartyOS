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
    return this.venuesService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.venuesService.remove(id, userId);
  }
}
