import { EventEmitter } from 'events';

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventLog: Array<{ event: string; data: any; timestamp: Date }>;
  private maxLogSize: number;

  private constructor() {
    super();
    this.eventLog = [];
    this.maxLogSize = 10000;
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit(event: string, ...args: any[]): boolean {
    const data = args.length === 1 ? args[0] : args;
    this.logEvent(event, data);
    return super.emit(event, ...args);
  }

  private logEvent(event: string, data: any): void {
    this.eventLog.push({
      event,
      data,
      timestamp: new Date()
    });

    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }

  getEventLog(filter?: { event?: string; since?: Date }): typeof this.eventLog {
    if (!filter) return this.eventLog;

    return this.eventLog.filter(entry => {
      if (filter.event && entry.event !== filter.event) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      return true;
    });
  }

  clearEventLog(): void {
    this.eventLog = [];
  }
}
