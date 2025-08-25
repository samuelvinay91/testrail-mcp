/**
 * Logging utility for TestRail MCP Server
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private logLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(
        `🐛 [DEBUG] ${new Date().toISOString()} - ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    }
  }

  info(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(
        `ℹ️  [INFO] ${new Date().toISOString()} - ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    }
  }

  warn(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(
        `⚠️  [WARN] ${new Date().toISOString()} - ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    }
  }

  error(message: string, error?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
  }
}

// Default logger instance
export const logger = new Logger(
  process.env.LOG_LEVEL === 'debug'
    ? LogLevel.DEBUG
    : process.env.LOG_LEVEL === 'warn'
      ? LogLevel.WARN
      : process.env.LOG_LEVEL === 'error'
        ? LogLevel.ERROR
        : LogLevel.INFO
);
