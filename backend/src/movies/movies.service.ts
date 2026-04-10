import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TmdbHttpService } from '../tmdb/tmdb-http.service';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly tmdbHttp: TmdbHttpService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'TMDB_BASE_URL',
      'https://api.themoviedb.org/3',
    );
  }

  async getNowPlaying(page: number = 1) {
    const cacheKey = `movies:now_playing:${page}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `${this.baseUrl}/movie/now_playing?api_key=${this.apiKey}&page=${page}`;
    const data = await this.tmdbHttp.fetch(url);

    await this.redisService.set(cacheKey, JSON.stringify(data), 3600);
    return data;
  }

  async getUpcoming(page: number = 1) {
    const cacheKey = `movies:upcoming:${page}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `${this.baseUrl}/movie/upcoming?api_key=${this.apiKey}&page=${page}`;
    const data = await this.tmdbHttp.fetch(url);

    await this.redisService.set(cacheKey, JSON.stringify(data), 3600);
    return data;
  }

  async getPopular(page: number = 1) {
    const cacheKey = `movies:popular:${page}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&page=${page}`;
    const data = await this.tmdbHttp.fetch(url);

    await this.redisService.set(cacheKey, JSON.stringify(data), 3600);
    return data;
  }

  async getMovieDetails(movieId: number) {
    const cacheKey = `movies:details:${movieId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}`;
    const data = await this.tmdbHttp.fetch(url);

    await this.redisService.set(cacheKey, JSON.stringify(data), 86400);
    return data;
  }

  async searchMovies(query: string, page: number = 1) {
    const cacheKey = `movies:search:${query}:${page}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&page=${page}`;
    const data = await this.tmdbHttp.fetch(url);

    await this.redisService.set(cacheKey, JSON.stringify(data), 1800);
    return data;
  }
}
