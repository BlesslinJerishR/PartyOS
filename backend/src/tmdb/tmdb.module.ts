import { Global, Module } from '@nestjs/common';
import { TmdbHttpService } from './tmdb-http.service';

@Global()
@Module({
  providers: [TmdbHttpService],
  exports: [TmdbHttpService],
})
export class TmdbModule {}
