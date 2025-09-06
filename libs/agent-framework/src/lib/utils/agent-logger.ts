import { AgentLogger } from '../types/agent-types';

/**
 * Console-based logger implementation for agents
 */
export class ConsoleAgentLogger implements AgentLogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  error(message: string, error?: Error, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '', data || '');
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

/**
 * Memory-based logger that stores logs in memory
 */
export class MemoryAgentLogger implements AgentLogger {
  private logs: Array<{
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
    timestamp: number;
  }> = [];

  private maxLogs: number;

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  debug(message: string, data?: any): void {
    this.addLog('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog('warn', message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.addLog('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...data,
    });
  }

  private addLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    this.logs.push({
      level,
      message,
      data,
      timestamp: Date.now(),
    });

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(level?: 'debug' | 'info' | 'warn' | 'error'): Array<{
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
    timestamp: number;
  }> {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Composite logger that can use multiple loggers
 */
export class CompositeAgentLogger implements AgentLogger {
  private loggers: AgentLogger[];

  constructor(loggers: AgentLogger[]) {
    this.loggers = loggers;
  }

  debug(message: string, data?: any): void {
    this.loggers.forEach((logger) => logger.debug(message, data));
  }

  info(message: string, data?: any): void {
    this.loggers.forEach((logger) => logger.info(message, data));
  }

  warn(message: string, data?: any): void {
    this.loggers.forEach((logger) => logger.warn(message, data));
  }

  error(message: string, error?: Error, data?: any): void {
    this.loggers.forEach((logger) => logger.error(message, error, data));
  }

  addLogger(logger: AgentLogger): void {
    this.loggers.push(logger);
  }

  removeLogger(logger: AgentLogger): void {
    const index = this.loggers.indexOf(logger);
    if (index > -1) {
      this.loggers.splice(index, 1);
    }
  }
}
