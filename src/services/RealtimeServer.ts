import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { Logger } from '../utils/Logger';
import { EventBus } from './EventBus';

export class RealtimeServer {
  private wss: WebSocketServer;
  private logger: Logger;
  private eventBus: EventBus;
  private clients: Set<WebSocket>;

  constructor(port: number, eventBus: EventBus) {
    this.wss = new WebSocketServer({ port });
    this.logger = new Logger('RealtimeServer');
    this.eventBus = eventBus;
    this.clients = new Set();
    this.setup();
  }

  private setup(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.logger.info('Client connected');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          this.logger.error(`Error handling message: ${error}`);
        }
      });

      ws.on('close', () => {
        this.logger.info('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error: ${error}`);
      });
    });

    // Subscribe to all events from EventBus
    this.eventBus.on('workflow:started', (data) => this.broadcast('workflow:started', data));
    this.eventBus.on('workflow:completed', (data) => this.broadcast('workflow:completed', data));
    this.eventBus.on('workflow:failed', (data) => this.broadcast('workflow:failed', data));
    this.eventBus.on('task:started', (data) => this.broadcast('task:started', data));
    this.eventBus.on('task:completed', (data) => this.broadcast('task:completed', data));
    this.eventBus.on('task:failed', (data) => this.broadcast('task:failed', data));
    this.eventBus.on('agent:registered', (data) => this.broadcast('agent:registered', data));
  }

  private handleClientMessage(ws: WebSocket, data: any): void {
    this.logger.debug(`Received message: ${data.type}`);

    switch (data.type) {
      case 'subscribe':
        ws.send(JSON.stringify({ type: 'subscribed', channels: data.channels }));
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        this.logger.warn(`Unknown message type: ${data.type}`);
    }
  }

  broadcast(event: string, data: any): void {
    const message = JSON.stringify({ type: 'event', event, data });
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
