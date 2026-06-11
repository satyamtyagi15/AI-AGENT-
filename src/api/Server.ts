import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from '../utils/Logger';
import { OrchestratorAgent } from '../core/OrchestratorAgent';
import { EventBus } from '../services/EventBus';
import {
  ContentResearchAgent,
  ScriptGenerationAgent,
  VoiceOverAgent,
  VideoAssemblyAgent,
  YouTubeUploadAgent,
  AnalyticsAgent
} from '../agents/SpecializedAgents';

export class APIServer {
  private app: Express;
  private logger: Logger;
  private orchestrator: OrchestratorAgent;
  private eventBus: EventBus;

  constructor(orchestrator: OrchestratorAgent, eventBus: EventBus) {
    this.app = express();
    this.logger = new Logger('APIServer');
    this.orchestrator = orchestrator;
    this.eventBus = eventBus;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // Create workflow
    this.app.post('/workflows', (req: Request, res: Response) => {
      try {
        const { name, description } = req.body;
        const workflow = this.orchestrator.createWorkflow(name, description);
        res.json({ success: true, workflow });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add task to workflow
    this.app.post('/workflows/:workflowId/tasks', (req: Request, res: Response) => {
      try {
        const { workflowId } = req.params;
        const { name, agentId, input, dependencies } = req.body;
        
        this.orchestrator.addTask(workflowId, {
          id: `task_${Date.now()}`,
          name,
          agentId,
          input,
          dependencies
        });

        res.json({ success: true, message: 'Task added' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute workflow
    this.app.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
      try {
        const { workflowId } = req.params;
        const result = await this.orchestrator.execute(workflowId);
        res.json({ success: true, workflow: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get workflow status
    this.app.get('/workflows/:workflowId', (req: Request, res: Response) => {
      try {
        const { workflowId } = req.params;
        const workflow = this.orchestrator.getWorkflowStatus(workflowId);
        res.json({ success: true, workflow });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List all workflows
    this.app.get('/workflows', (req: Request, res: Response) => {
      try {
        const workflows = this.orchestrator.listWorkflows();
        res.json({ success: true, workflows });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get event log
    this.app.get('/events', (req: Request, res: Response) => {
      try {
        const events = this.eventBus.getEventLog();
        res.json({ success: true, events, count: events.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create and run video generation workflow
    this.app.post('/generate-video', async (req: Request, res: Response) => {
      try {
        const { topic, style, keywords } = req.body;
        
        const workflow = this.orchestrator.createWorkflow(
          `Video Generation: ${topic}`,
          `Auto-generated video for topic: ${topic}`
        );

        // Add tasks
        this.orchestrator.addTask(workflow.id, {
          id: 'research',
          name: 'Content Research',
          agentId: 'content-agent',
          input: { topic, keywords },
          maxRetries: 2
        });

        this.orchestrator.addTask(workflow.id, {
          id: 'script',
          name: 'Script Generation',
          agentId: 'script-agent',
          input: { topic, style, duration: 600 },
          dependencies: ['research'],
          maxRetries: 2
        });

        this.orchestrator.addTask(workflow.id, {
          id: 'voiceover',
          name: 'Voice Over Generation',
          agentId: 'voice-agent',
          input: { text: 'Sample script text', voiceId: 'default', speed: 1.0 },
          dependencies: ['script'],
          maxRetries: 2
        });

        this.orchestrator.addTask(workflow.id, {
          id: 'assembly',
          name: 'Video Assembly',
          agentId: 'video-agent',
          input: { audioPath: '', visuals: [], subtitles: {}, effects: {} },
          dependencies: ['voiceover'],
          maxRetries: 1
        });

        this.orchestrator.addTask(workflow.id, {
          id: 'upload',
          name: 'YouTube Upload',
          agentId: 'upload-agent',
          input: { videoPath: '', title: topic, description: '', tags: keywords, thumbnail: '' },
          dependencies: ['assembly'],
          maxRetries: 2
        });

        // Execute workflow
        const result = await this.orchestrator.execute(workflow.id);
        res.json({ success: true, workflow: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Error handling
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      this.logger.info(`API Server running on port ${port}`);
    });
  }
}
