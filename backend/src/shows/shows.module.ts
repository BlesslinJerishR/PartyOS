import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ShowsService } from './shows.service';
import { ShowsController } from './shows.controller';
import { ShowsProcessor } from './shows.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'shows' })],
  controllers: [ShowsController],
  providers: [ShowsService, ShowsProcessor],
  exports: [ShowsService],
})
export class ShowsModule {}
