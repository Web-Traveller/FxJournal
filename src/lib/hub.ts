import { HeartbeatResult } from '../types';

const HUB_KEYS = {
  WORKSTATION_ID: 'fxjournal_workstation_id',
  LAUNCH_COUNT: 'fxjournal_launch_count',
  SIMULATE_BLOCKED: 'fxjournal_simulate_blocked', // For developer test mode
};

export class HubClient {
  static getWorkstationId(): string {
    let id = localStorage.getItem(HUB_KEYS.WORKSTATION_ID);
    if (!id) {
      // Deterministic workstation UUID
      id = 'ws-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem(HUB_KEYS.WORKSTATION_ID, id);
    }
    return id;
  }

  static getLaunchCount(): number {
    const count = parseInt(localStorage.getItem(HUB_KEYS.LAUNCH_COUNT) || '0', 10) + 1;
    localStorage.setItem(HUB_KEYS.LAUNCH_COUNT, count.toString());
    return count;
  }

  static isSimulatedBlocked(): boolean {
    return localStorage.getItem(HUB_KEYS.SIMULATE_BLOCKED) === 'true';
  }

  static setSimulatedBlocked(blocked: boolean): void {
    localStorage.setItem(HUB_KEYS.SIMULATE_BLOCKED, blocked ? 'true' : 'false');
  }

  /**
   * Heartbeat to check workstation authorization & new version availability.
   */
  static async checkHeartbeat(): Promise<HeartbeatResult> {
    const launchCount = this.getLaunchCount();

    // Check if test block flag is on
    if (this.isSimulatedBlocked()) {
      return {
        allowed: false,
        latest_version: '0.1.0',
        launch_count: launchCount,
        message: 'Application Error: The software encountered an unexpected initialization failure (Error 0x8004100E). Please contact developer support.'
      };
    }

    return {
      allowed: true,
      latest_version: '0.1.0',
      launch_count: launchCount,
    };
  }

  /**
   * Log an unexpected crash or error to developer telemetry.
   */
  static async logError(errorType: string, message: string, stack?: string): Promise<void> {
    const payload = {
      app_id: 'fxjournal',
      workstation_id: this.getWorkstationId(),
      app_version: '0.1.0',
      os_info: navigator.userAgent.substring(0, 200),
      error_type: errorType,
      error_message: message,
      stack_trace: stack || '',
      timestamp: new Date().toISOString(),
    };

    console.warn('[FxJournal Hub Telemetry]', payload);
  }

  /**
   * Initializes global runtime error hooks.
   */
  static initGlobalErrorHooks(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      HubClient.logError(
        'UncaughtException',
        typeof message === 'string' ? message : 'Unknown error',
        error?.stack || `${source}:${lineno}:${colno}`
      );
    };

    window.onunhandledrejection = (event) => {
      HubClient.logError(
        'UnhandledPromiseRejection',
        event.reason?.message || String(event.reason),
        event.reason?.stack
      );
    };
  }
}
