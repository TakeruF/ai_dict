/**
 * Debug utility for tracking loading states and performance issues
 */

interface LoadingEvent {
  timestamp: number;
  type: 'start' | 'end' | 'error';
  source: string;
  details?: any;
}

class LoadingDebugger {
  private events: LoadingEvent[] = [];
  private isEnabled: boolean = false;

  constructor() {
    // Enable debugging in development or if explicitly requested
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    (typeof window !== 'undefined' && window.location.search.includes('debug=true'));
  }

  logStart(source: string, details?: any) {
    if (!this.isEnabled) return;
    
    const event: LoadingEvent = {
      timestamp: Date.now(),
      type: 'start',
      source,
      details
    };
    
    this.events.push(event);
    console.log(`🔄 [Loading] Started: ${source}`, details);
    
    // Keep only last 100 events to prevent memory leak
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  logEnd(source: string, details?: any) {
    if (!this.isEnabled) return;
    
    const event: LoadingEvent = {
      timestamp: Date.now(),
      type: 'end',
      source,
      details
    };
    
    this.events.push(event);
    
    // Find matching start event
    const matchingStart = [...this.events].reverse().find(
      e => e.source === source && e.type === 'start'
    );
    
    const duration = matchingStart ? event.timestamp - matchingStart.timestamp : undefined;
    console.log(`✅ [Loading] Completed: ${source} ${duration ? `(${duration}ms)` : ''}`, details);
  }

  logError(source: string, error: any) {
    if (!this.isEnabled) return;
    
    const event: LoadingEvent = {
      timestamp: Date.now(),
      type: 'error',
      source,
      details: error
    };
    
    this.events.push(event);
    console.error(`❌ [Loading] Error: ${source}`, error);
  }

  getActiveLoading(): string[] {
    if (!this.isEnabled) return [];
    
    const active: string[] = [];
    const sourceStates = new Map<string, 'loading' | 'completed'>();
    
    for (const event of this.events) {
      if (event.type === 'start') {
        sourceStates.set(event.source, 'loading');
      } else if (event.type === 'end' || event.type === 'error') {
        sourceStates.set(event.source, 'completed');
      }
    }
    
    for (const [source, state] of sourceStates) {
      if (state === 'loading') {
        active.push(source);
      }
    }
    
    return active;
  }

  getSummary(): { totalEvents: number; activeLoading: string[]; recentEvents: LoadingEvent[] } {
    return {
      totalEvents: this.events.length,
      activeLoading: this.getActiveLoading(),
      recentEvents: this.events.slice(-10)
    };
  }

  detectLongRunningLoading(thresholdMs: number = 5000): string[] {
    const now = Date.now();
    const longRunning: string[] = [];
    const sourceStates = new Map<string, number>();
    
    for (const event of this.events) {
      if (event.type === 'start') {
        sourceStates.set(event.source, event.timestamp);
      } else if (event.type === 'end' || event.type === 'error') {
        sourceStates.delete(event.source);
      }
    }
    
    for (const [source, startTime] of sourceStates) {
      if (now - startTime > thresholdMs) {
        longRunning.push(source);
      }
    }
    
    return longRunning;
  }
}

export const loadingDebugger = new LoadingDebugger();

// Global debug helpers
if (typeof window !== 'undefined') {
  (window as any).loadingDebug = {
    getSummary: () => loadingDebugger.getSummary(),
    getActive: () => loadingDebugger.getActiveLoading(),
    detectLongRunning: (ms?: number) => loadingDebugger.detectLongRunningLoading(ms),
  };
  
  // Emergency auth reset function
  (window as any).emergencyAuthReset = () => {
    const event = new CustomEvent('emergency-auth-reset');
    window.dispatchEvent(event);
    console.warn('Emergency auth reset triggered');
  };
}