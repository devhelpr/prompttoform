import { AgentMetrics } from '../types/agent-types';

/**
 * In-memory metrics implementation for agents
 */
export class MemoryAgentMetrics implements AgentMetrics {
  private counters: Map<string, number> = new Map();
  private timings: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  recordTiming(name: string, duration: number): void {
    if (!this.timings.has(name)) {
      this.timings.set(name, []);
    }
    this.timings.get(name)!.push(duration);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  getTimingStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const timings = this.timings.get(name);
    if (!timings || timings.length === 0) {
      return null;
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sorted.reduce((sum, val) => sum + val, 0) / count;
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, min, max, avg, p50, p95, p99 };
  }

  getGauge(name: string): number | null {
    return this.gauges.get(name) || null;
  }

  getHistogramStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sorted.reduce((sum, val) => sum + val, 0) / count;
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, min, max, avg, p50, p95, p99 };
  }

  getAllMetrics(): {
    counters: Record<string, number>;
    timings: Record<string, any>;
    gauges: Record<string, number>;
    histograms: Record<string, any>;
  } {
    const counters: Record<string, number> = {};
    const timings: Record<string, any> = {};
    const gauges: Record<string, number> = {};
    const histograms: Record<string, any> = {};

    for (const [name, value] of this.counters) {
      counters[name] = value;
    }

    for (const [name] of this.timings) {
      timings[name] = this.getTimingStats(name);
    }

    for (const [name, value] of this.gauges) {
      gauges[name] = value;
    }

    for (const [name] of this.histograms) {
      histograms[name] = this.getHistogramStats(name);
    }

    return { counters, timings, gauges, histograms };
  }

  clearMetrics(): void {
    this.counters.clear();
    this.timings.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  clearMetric(name: string): void {
    this.counters.delete(name);
    this.timings.delete(name);
    this.gauges.delete(name);
    this.histograms.delete(name);
  }
}

/**
 * No-op metrics implementation for testing or when metrics are disabled
 */
export class NoOpAgentMetrics implements AgentMetrics {
  incrementCounter(name: string, value?: number): void {
    // No-op
  }

  recordTiming(name: string, duration: number): void {
    // No-op
  }

  setGauge(name: string, value: number): void {
    // No-op
  }

  recordHistogram(name: string, value: number): void {
    // No-op
  }
}
