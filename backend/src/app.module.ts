import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { VenuesModule } from './venues/venues.module';
import { SeatsModule } from './seats/seats.module';
import { ShowsModule } from './shows/shows.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MovieRequestsModule } from './movie-requests/movie-requests.module';
import { SnacksModule } from './snacks/snacks.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },    // 3 req/sec per IP
      { name: 'medium', ttl: 10000, limit: 20 },  // 20 req/10sec
      { name: 'long', ttl: 60000, limit: 100 },   // 100 req/min
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    TmdbModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    VenuesModule,
    SeatsModule,
    ShowsModule,
    TicketsModule,
    ReviewsModule,
    MovieRequestsModule,
    SnacksModule,
    LocationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
