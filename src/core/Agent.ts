import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger';

export interface AgentConfig {
  id?: string;
  name: string;
  type: string;
  description?: string;
  timeout?: number;
  retryAttempts?: number;
  maxConcurrent?: number;
}

export interface AgentMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  payload: any;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentState {
  status: 'idle' | 'running' | 'paused' | 'error';
  currentTask?: string;
  progress?: number;
  error?: string;
  memory?: Record<string, any>;
}

export abstract class Agent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected type: string;
  protected description: string;
  protected timeout: number;
  protected retryAttempts: number;
  protected maxConcurrent: number;
  protected state: AgentState;
  protected memory: Map<string, any>;
  protected logger: Logger;
  protected messageQueue: AgentMessage[];
  protected messageHandler: Map<string, Function>;

  constructor(config: AgentConfig) {
    super();
    this.id = config.id || uuidv4();
    this.name = config.name;
    this.type = config.type;
    this.description = config.description || '';
    this.timeout = config.timeout || 300000; // 5 minutes default
    this.retryAttempts = config.retryAttempts || 3;
    this.maxConcurrent = config.maxConcurrent || 1;
    
    this.state = {
      status: 'idle',
      progress: 0,
      memory: {}
    };
    
    this.memory = new Map();
    this.messageQueue = [];
    this.messageHandler = new Map();
    this.logger = new Logger(`Agent:${this.name}`);
    
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    this.on('message', (msg: AgentMessage) => this.handleMessage(msg));
    this.on('error', (error: Error) => this.handleError(error));
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info(`Initializing agent: ${this.name}`);
    this.state.status = 'idle';
    await this.setupConnections();
  }

  /**
   * Setup connections/dependencies
   */
  protected async setupConnections(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Execute a task
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Handle incoming messages
   */
  async handleMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Received message from ${message.senderId}: ${message.type}`);
    
    const handler = this.messageHandler.get(message.type);
    if (handler) {
      try {
        await handler.call(this, message);
      } catch (error) {
        this.logger.error(`Error handling message: ${error}`);
        this.emit('error', error);
      }
    } else {
      this.logger.warn(`No handler for message type: ${message.type}`);
    }
  }

  /**
   * Handle errors
   */
  protected handleError(error: Error): void {
    this.logger.error(`Agent error: ${error.message}`);
    this.state.status = 'error';
    this.state.error = error.message;
  }

  /**
   * Register a message handler
   */
  registerHandler(messageType: string, handler: Function): void {
    this.messageHandler.set(messageType, handler);
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(receiverId: string, type: string, payload: any, priority: string = 'medium'): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: uuidv4(),
      senderId: this.id,
      receiverId,
      type,
      payload,
      timestamp: new Date(),
      priority: priority as any
    };

    this.logger.info(`Sending message to ${receiverId}: ${type}`);
    this.emit('message:sent', message);
    
    return message;
  }

  /**
   * Store data in memory
   */
  storeMemory(key: string, value: any, ttl?: number): void {
    this.memory.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Retrieve data from memory
   */
  getMemory(key: string): any {
    const item = this.memory.get(key);
    if (!item) return null;

    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.memory.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Clear memory
   */
  clearMemory(key?: string): void {
    if (key) {
      this.memory.delete(key);
    } else {
      this.memory.clear();
    }
  }

  /**
   * Get agent state
   */
  getState(): AgentState {
    return {
      ...this.state,
      memory: Object.fromEntries(this.memory)
    };
  }

  /**
   * Update agent state
   */
  setState(state: Partial<AgentState>): void {
    this.state = { ...this.state, ...state };
    this.emit('state:changed', this.state);
  }

  /**
   * Get agent info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      state: this.getState()
    };
  }

  /**
   * Shutdown agent
   */
  async shutdown(): Promise<void> {
    this.logger.info(`Shutting down agent: ${this.name}`);
    this.removeAllListeners();
    this.memory.clear();
    this.messageQueue = [];
    this.state.status = 'idle';
  }
}
