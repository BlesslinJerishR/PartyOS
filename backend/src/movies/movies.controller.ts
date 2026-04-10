import { Controller, Get, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoviesService } from './movies.service';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  private parsePage(page?: string): number {
    if (!page) return 1;
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1 || p > 500) return 1;
    return p;
  }

  @Get('now-playing')
  getNowPlaying(@Query('page') page?: string) {
    return this.moviesService.getNowPlaying(this.parsePage(page));
  }

  @Get('upcoming')
  getUpcoming(@Query('page') page?: string) {
    return this.moviesService.getUpcoming(this.parsePage(page));
  }

  @Get('popular')
  getPopular(@Query('page') page?: string) {
    return this.moviesService.getPopular(this.parsePage(page));
  }

  @Get('search')
  searchMovies(
    @Query('query') query: string,
    @Query('page') page?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }
    if (query.length > 200) {
      throw new BadRequestException('Search query too long');
    }
    return this.moviesService.searchMovies(
      query.trim(),
      this.parsePage(page),
    );
  }

  @Get(':id')
  getMovieDetails(@Param('id') id: string) {
    const movieId = parseInt(id, 10);
    if (isNaN(movieId) || movieId < 1) {
      throw new BadRequestException('Invalid movie ID');
    }
    return this.moviesService.getMovieDetails(movieId);
  }
}
