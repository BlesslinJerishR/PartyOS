import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('shows')
export class ShowsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'update-status') {
      const { showId, status } = job.data;
      await this.prisma.show.update({
        where: { id: showId },
        data: { status },
      });
    }
  }
}
