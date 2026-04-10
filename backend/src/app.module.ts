import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      }),
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
})
export class AppModule {}
