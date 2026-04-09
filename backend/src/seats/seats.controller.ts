import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { BatchCreateSeatsDto } from './dto/batch-create-seats.dto';

@Controller('seats')
@UseGuards(JwtAuthGuard)
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSeatDto) {
    return this.seatsService.create(userId, dto);
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  batchCreate(
    @CurrentUser('id') userId: string,
    @Body() dto: BatchCreateSeatsDto,
  ) {
    return this.seatsService.batchCreate(userId, dto);
  }

  @Get('venue/:venueId')
  findByVenue(@Param('venueId') venueId: string) {
    return this.seatsService.findByVenue(venueId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.seatsService.remove(id, userId);
  }
}
