import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const workflowSchema = new mongoose.Schema({
  workflowId: String,
  name: String,
  description: String,
  status: String,
  tasks: [{
    id: String,
    name: String,
    agentId: String,
    status: String,
    result: mongoose.Schema.Types.Mixed,
    error: String,
    createdAt: Date,
    completedAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const agentStateSchema = new mongoose.Schema({
  agentId: String,
  name: String,
  type: String,
  status: String,
  memory: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now }
});

const videoMetadataSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  description: String,
  topic: String,
  keywords: [String],
  scriptPath: String,
  audioPath: String,
  videoPath: String,
  thumbnailPath: String,
  youtubeUrl: String,
  status: String,
  analytics: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  publishedAt: Date
});

export class Database {
  private logger: Logger;
  private mongoUri: string;

  constructor() {
    this.logger = new Logger('Database');
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_agent';
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.mongoUri);
      this.logger.info('Connected to MongoDB');
      this.createModels();
    } catch (error) {
      this.logger.error(`MongoDB connection error: ${error}`);
      throw error;
    }
  }

  private createModels(): void {
    mongoose.model('Workflow', workflowSchema);
    mongoose.model('AgentState', agentStateSchema);
    mongoose.model('VideoMetadata', videoMetadataSchema);
  }

  async saveWorkflow(workflow: any): Promise<any> {
    try {
      const Workflow = mongoose.model('Workflow');
      const doc = new Workflow(workflow);
      return await doc.save();
    } catch (error) {
      this.logger.error(`Error saving workflow: ${error}`);
      throw error;
    }
  }

  async saveAgentState(agentState: any): Promise<any> {
    try {
      const AgentState = mongoose.model('AgentState');
      return await AgentState.updateOne(
        { agentId: agentState.agentId },
        agentState,
        { upsert: true }
      );
    } catch (error) {
      this.logger.error(`Error saving agent state: ${error}`);
      throw error;
    }
  }

  async saveVideoMetadata(metadata: any): Promise<any> {
    try {
      const VideoMetadata = mongoose.model('VideoMetadata');
      const doc = new VideoMetadata(metadata);
      return await doc.save();
    } catch (error) {
      this.logger.error(`Error saving video metadata: ${error}`);
      throw error;
    }
  }

  async getWorkflow(workflowId: string): Promise<any> {
    try {
      const Workflow = mongoose.model('Workflow');
      return await Workflow.findOne({ workflowId });
    } catch (error) {
      this.logger.error(`Error retrieving workflow: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.logger.info('Disconnected from MongoDB');
    } catch (error) {
      this.logger.error(`Error disconnecting from MongoDB: ${error}`);
    }
  }
}
