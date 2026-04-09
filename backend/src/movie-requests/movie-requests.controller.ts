import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MovieRequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MovieRequestsService } from './movie-requests.service';
import { CreateMovieRequestDto } from './dto/create-movie-request.dto';

@Controller('movie-requests')
@UseGuards(JwtAuthGuard)
export class MovieRequestsController {
  constructor(private readonly movieRequestsService: MovieRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('GUEST' as any)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMovieRequestDto,
  ) {
    return this.movieRequestsService.create(userId, dto);
  }

  @Get('host')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  findByHost(@CurrentUser('id') userId: string) {
    return this.movieRequestsService.findByHost(userId);
  }

  @Get('my')
  findByGuest(@CurrentUser('id') userId: string) {
    return this.movieRequestsService.findByGuest(userId);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  accept(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.movieRequestsService.updateStatus(
      id,
      userId,
      MovieRequestStatus.ACCEPTED,
    );
  }

  @Patch(':id/decline')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  decline(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.movieRequestsService.updateStatus(
      id,
      userId,
      MovieRequestStatus.DECLINED,
    );
  }
}
