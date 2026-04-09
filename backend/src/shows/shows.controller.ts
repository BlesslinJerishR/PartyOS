import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShowsService } from './shows.service';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';

@Controller('shows')
@UseGuards(JwtAuthGuard)
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShowDto) {
    return this.showsService.create(userId, dto);
  }

  @Get('now-playing')
  findNowPlaying(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    return this.showsService.findNowPlaying(
      latitude ? parseFloat(latitude) : undefined,
      longitude ? parseFloat(longitude) : undefined,
    );
  }

  @Get('upcoming')
  findUpcoming(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    return this.showsService.findUpcoming(
      latitude ? parseFloat(latitude) : undefined,
      longitude ? parseFloat(longitude) : undefined,
    );
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  findMyShows(@CurrentUser('id') userId: string) {
    return this.showsService.findByHost(userId);
  }

  @Get('markers')
  getMapMarkers() {
    return this.showsService.getMapMarkers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.showsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateShowDto,
  ) {
    return this.showsService.update(id, userId, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.showsService.cancel(id, userId);
  }
}
