import { Module } from '@nestjs/common';
import { MovieRequestsService } from './movie-requests.service';
import { MovieRequestsController } from './movie-requests.controller';

@Module({
  controllers: [MovieRequestsController],
  providers: [MovieRequestsService],
  exports: [MovieRequestsService],
})
export class MovieRequestsModule {}
