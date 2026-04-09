import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { BookTicketDto } from './dto/book-ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('GUEST' as any)
  book(@CurrentUser('id') userId: string, @Body() dto: BookTicketDto) {
    return this.ticketsService.book(userId, dto);
  }

  @Get('my')
  findMyTickets(@CurrentUser('id') userId: string) {
    return this.ticketsService.findMyTickets(userId);
  }

  @Get('show/:showId')
  findByShow(@Param('showId') showId: string) {
    return this.ticketsService.findByShow(showId);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('GUEST' as any)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketsService.cancel(id, userId);
  }

  @Patch(':id/check-in')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  checkIn(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketsService.checkIn(id, userId);
  }
}
