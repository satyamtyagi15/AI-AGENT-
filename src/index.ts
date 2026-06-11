import dotenv from 'dotenv';
import { Logger } from './utils/Logger';
import { OrchestratorAgent } from './core/OrchestratorAgent';
import { EventBus } from './services/EventBus';
import { APIServer } from './api/Server';
import { RealtimeServer } from './services/RealtimeServer';
import { Database } from './services/Database';
import { MessageQueue } from './services/MessageQueue';
import {
  ContentResearchAgent,
  ScriptGenerationAgent,
  VoiceOverAgent,
  VideoAssemblyAgent,
  YouTubeUploadAgent,
  AnalyticsAgent
} from './agents/SpecializedAgents';

dotenv.config();

const logger = new Logger('Main');

class AIAgentSystem {
  private orchestrator: OrchestratorAgent;
  private eventBus: EventBus;
  private apiServer: APIServer;
  private realtimeServer: RealtimeServer;
  private database: Database;
  private messageQueue: MessageQueue;
  private agents: Map<string, any>;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.orchestrator = new OrchestratorAgent(
      { name: 'Master Orchestrator', type: 'orchestrator' },
      this.eventBus
    );
    this.apiServer = new APIServer(this.orchestrator, this.eventBus);
    this.realtimeServer = new RealtimeServer(3002, this.eventBus);
    this.database = new Database();
    this.messageQueue = new MessageQueue('video-generation');
    this.agents = new Map();
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Agent System...');

      // Connect to database
      await this.database.connect();

      // Initialize orchestrator
      await this.orchestrator.initialize();

      // Create and register specialized agents
      this.initializeAgents();

      // Setup message processing
      await this.setupMessageProcessing();

      logger.info('AI Agent System initialized successfully');
    } catch (error) {
      logger.error(`Initialization error: ${error}`);
      throw error;
    }
  }

  private initializeAgents(): void {
    const agents = [
      {
        id: 'content-agent',
        agent: new ContentResearchAgent({
          name: 'Content Research Agent',
          type: 'research'
        })
      },
      {
        id: 'script-agent',
        agent: new ScriptGenerationAgent({
          name: 'Script Generation Agent',
          type: 'generation'
        })
      },
      {
        id: 'voice-agent',
        agent: new VoiceOverAgent({
          name: 'Voice Over Agent',
          type: 'audio'
        })
      },
      {
        id: 'video-agent',
        agent: new VideoAssemblyAgent({
          name: 'Video Assembly Agent',
          type: 'video'
        })
      },
      {
        id: 'upload-agent',
        agent: new YouTubeUploadAgent({
          name: 'YouTube Upload Agent',
          type: 'upload'
        })
      },
      {
        id: 'analytics-agent',
        agent: new AnalyticsAgent({
          name: 'Analytics Agent',
          type: 'analytics'
        })
      }
    ];

    agents.forEach(({ id, agent }) => {
      this.orchestrator.registerAgent(id, agent);
      this.agents.set(id, agent);
      logger.info(`Agent registered: ${id}`);
    });
  }

  private async setupMessageProcessing(): Promise<void> {
    await this.messageQueue.processJobs(async (job) => {
      logger.info(`Processing job: ${job.id}`);
      // Handle job processing
      return { success: true, jobId: job.id };
    });
  }

  async start(): Promise<void> {
    try {
      const apiPort = parseInt(process.env.PORT || '3001');
      this.apiServer.start(apiPort);
      logger.info(`API Server started on port ${apiPort}`);
      logger.info('Realtime Server started on port 3002');
      logger.info('System ready for video generation');
    } catch (error) {
      logger.error(`Start error: ${error}`);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down AI Agent System...');
      
      // Shutdown agents
      for (const [id, agent] of this.agents) {
        await agent.shutdown();
        logger.info(`Agent shutdown: ${id}`);
      }

      // Clear message queue
      await this.messageQueue.clearQueue();

      // Disconnect database
      await this.database.disconnect();

      logger.info('AI Agent System shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error(`Shutdown error: ${error}`);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const system = new AIAgentSystem();

  // Handle graceful shutdown
  process.on('SIGINT', () => system.shutdown());
  process.on('SIGTERM', () => system.shutdown());

  try {
    await system.initialize();
    await system.start();
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

main();
