import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoviesService } from './movies.service';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('now-playing')
  getNowPlaying(@Query('page') page?: string) {
    return this.moviesService.getNowPlaying(page ? parseInt(page, 10) : 1);
  }

  @Get('upcoming')
  getUpcoming(@Query('page') page?: string) {
    return this.moviesService.getUpcoming(page ? parseInt(page, 10) : 1);
  }

  @Get('popular')
  getPopular(@Query('page') page?: string) {
    return this.moviesService.getPopular(page ? parseInt(page, 10) : 1);
  }

  @Get('search')
  searchMovies(
    @Query('query') query: string,
    @Query('page') page?: string,
  ) {
    return this.moviesService.searchMovies(
      query,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get(':id')
  getMovieDetails(@Param('id') id: string) {
    return this.moviesService.getMovieDetails(parseInt(id, 10));
  }
}
