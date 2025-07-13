/**
 * Advanced Logging System for N8N MCP Server
 * Implements detailed logging with levels, traceability, and structured output
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  operation?: string;
  workflowId?: string;
  executionId?: string;
  userId?: string;
  timestamp?: string;
  duration?: number;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logHistory: Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> = [];
  private maxHistorySize = 1000;

  private constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.enableConsole = process.env.DISABLE_CONSOLE_OUTPUT !== 'true';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    
    let formatted = `[${timestamp}] ${levelStr} ${message}`;
    
    if (context) {
      const contextStr = Object.entries(context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      
      if (contextStr) {
        formatted += ` | ${contextStr}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const formatted = this.formatMessage(level, message, context);

    // Add to history
    this.logHistory.push({ level, message, context, timestamp });
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output
    if (this.enableConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.debug(formatted);
          break;
        default:
          console.log(formatted);
      }
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Performance tracking
  startTimer(operation: string, context?: LogContext): () => void {
    const startTime = Date.now();
    this.debug(`Starting operation: ${operation}`, context);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed operation: ${operation}`, { ...context, duration });
    };
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> {
    return this.logHistory.slice(-count);
  }

  // Clear log history
  clearHistory(): void {
    this.logHistory = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();