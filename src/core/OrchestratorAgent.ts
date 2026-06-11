import { Agent, AgentConfig, AgentMessage } from './Agent';
import { Logger } from '../utils/Logger';
import { EventBus } from '../services/EventBus';

export interface WorkflowTask {
  id: string;
  name: string;
  agentId: string;
  input: any;
  dependencies?: string[];
  retryCount?: number;
  maxRetries?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  tasks: WorkflowTask[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export class OrchestratorAgent extends Agent {
  private workflows: Map<string, Workflow>;
  private agentRegistry: Map<string, Agent>;
  private eventBus: EventBus;
  private resourcePool: Map<string, number>;

  constructor(config: AgentConfig, eventBus: EventBus) {
    super(config);
    this.workflows = new Map();
    this.agentRegistry = new Map();
    this.eventBus = eventBus;
    this.resourcePool = new Map();
  }

  /**
   * Register a worker agent
   */
  registerAgent(agentId: string, agent: Agent): void {
    this.agentRegistry.set(agentId, agent);
    this.logger.info(`Agent registered: ${agentId}`);
    this.eventBus.emit('agent:registered', { agentId, timestamp: new Date() });
  }

  /**
   * Create a new workflow
   */
  createWorkflow(name: string, description?: string): Workflow {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name,
      description,
      tasks: [],
      status: 'idle',
      createdAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);
    this.logger.info(`Workflow created: ${workflow.id}`);
    return workflow;
  }

  /**
   * Add task to workflow
   */
  addTask(workflowId: string, task: Omit<WorkflowTask, 'status'>): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const newTask: WorkflowTask = {
      ...task,
      status: 'pending',
      retryCount: 0,
      maxRetries: task.maxRetries || 3
    };

    workflow.tasks.push(newTask);
    this.logger.info(`Task added to workflow: ${newTask.id}`);
  }

  /**
   * Execute workflow
   */
  async execute(workflowId: string): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    this.logger.info(`Executing workflow: ${workflow.id}`);
    this.state.status = 'running';
    this.state.currentTask = workflow.id;
    this.eventBus.emit('workflow:started', { workflowId: workflow.id, timestamp: new Date() });

    try {
      // Execute tasks in order, respecting dependencies
      for (const task of workflow.tasks) {
        await this.executeTask(workflow, task);
      }

      workflow.status = 'completed';
      workflow.completedAt = new Date();
      this.eventBus.emit('workflow:completed', { workflowId: workflow.id, timestamp: new Date() });
    } catch (error) {
      workflow.status = 'failed';
      this.state.status = 'error';
      this.state.error = error.message;
      this.eventBus.emit('workflow:failed', { 
        workflowId: workflow.id, 
        error: error.message, 
        timestamp: new Date() 
      });
      throw error;
    }

    return workflow;
  }

  /**
   * Execute a single task
   */
  private async executeTask(workflow: Workflow, task: WorkflowTask): Promise<void> {
    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const allDependenciesComplete = task.dependencies.every(depId => {
        const depTask = workflow.tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });

      if (!allDependenciesComplete) {
        throw new Error(`Task dependencies not satisfied: ${task.id}`);
      }
    }

    const agent = this.agentRegistry.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${task.agentId}`);
    }

    task.status = 'running';
    this.eventBus.emit('task:started', { taskId: task.id, timestamp: new Date() });

    try {
      // Execute task with retry logic
      let result;
      let lastError;

      for (let attempt = 0; attempt <= task.maxRetries!; attempt++) {
        try {
          result = await Promise.race([
            agent.execute(task.input),
            this.createTimeout(this.timeout)
          ]);
          task.status = 'completed';
          task.result = result;
          this.logger.info(`Task completed: ${task.id}`);
          this.eventBus.emit('task:completed', { taskId: task.id, result, timestamp: new Date() });
          return;
        } catch (error) {
          lastError = error;
          task.retryCount = attempt + 1;
          if (attempt < task.maxRetries!) {
            this.logger.warn(`Task failed (attempt ${attempt + 1}/${task.maxRetries}): ${task.id}`);
            await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
          }
        }
      }

      task.status = 'failed';
      task.error = lastError?.message;
      this.logger.error(`Task failed after ${task.maxRetries} retries: ${task.id}`);
      this.eventBus.emit('task:failed', { taskId: task.id, error: lastError?.message, timestamp: new Date() });
      throw lastError;
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Allocate resources
   */
  allocateResource(resourceType: string, amount: number): boolean {
    const available = this.resourcePool.get(resourceType) || 0;
    if (available >= amount) {
      this.resourcePool.set(resourceType, available - amount);
      return true;
    }
    return false;
  }

  /**
   * Release resources
   */
  releaseResource(resourceType: string, amount: number): void {
    const available = this.resourcePool.get(resourceType) || 0;
    this.resourcePool.set(resourceType, available + amount);
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Task timeout')), ms)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
