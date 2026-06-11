import Queue from 'bull';
import { Logger } from '../utils/Logger';

export class MessageQueue {
  private queue: Queue.Queue;
  private logger: Logger;
  private redisUrl: string;

  constructor(queueName: string = 'agent-tasks') {
    this.logger = new Logger('MessageQueue');
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.queue = new Queue(queueName, this.redisUrl);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.queue.on('completed', (job) => {
      this.logger.info(`Job completed: ${job.id}`);
    });

    this.queue.on('failed', (job, error) => {
      this.logger.error(`Job failed: ${job.id} - ${error.message}`);
    });

    this.queue.on('error', (error) => {
      this.logger.error(`Queue error: ${error.message}`);
    });
  }

  async addJob(data: any, options?: any): Promise<Queue.Job> {
    return this.queue.add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      ...options
    });
  }

  async processJobs(handler: (job: Queue.Job) => Promise<any>): Promise<void> {
    this.queue.process(5, async (job) => {
      return await handler(job);
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      state: await job.getState()
    };
  }

  async clearQueue(): Promise<void> {
    await this.queue.clean(0);
    this.logger.info('Queue cleared');
  }
}
