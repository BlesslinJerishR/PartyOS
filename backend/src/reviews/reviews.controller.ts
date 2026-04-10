import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('GUEST' as any)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('host/:hostId')
  findByHost(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.reviewsService.findByHost(hostId);
  }

  @Get('host/:hostId/rating')
  getHostRating(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.reviewsService.getHostRating(hostId);
  }

  @Get('show/:showId')
  findByShow(@Param('showId', ParseUUIDPipe) showId: string) {
    return this.reviewsService.findByShow(showId);
  }
}
