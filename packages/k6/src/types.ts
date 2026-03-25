/**
 * Supported k6 test types, each with a different load profile.
 */
export type K6TestType = 'load' | 'stress' | 'spike' | 'soak';

/**
 * A single k6 ramping stage.
 */
export interface K6Stage {
  duration: string;
  target: number;
}

/**
 * A k6 threshold definition.
 */
export interface K6Threshold {
  metric: string;
  condition: string;
}

/**
 * An API endpoint to include in generated k6 scripts.
 */
export interface K6Endpoint {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Configuration for the k6 plugin (k6.config.ts).
 */
export interface K6Config {
  /** Test profile type. Default: 'load' */
  testType: K6TestType;
  /** Number of virtual users. Default: 10 */
  vus: number;
  /** Test duration (k6 format, e.g. '30s', '5m'). Default: '30s' */
  duration: string;
  /** Custom ramping stages — overrides testType preset when provided */
  stages?: K6Stage[];
  /** Performance thresholds. Default: [p(95)<500, rate<0.01] */
  thresholds: K6Threshold[];
  /** Base URL for generated scripts */
  baseURL?: string;
  /** Path to k6 binary. Default: 'k6' */
  k6BinaryPath: string;
  /** Timeout for k6 execution in seconds. Default: 300 */
  timeoutSeconds: number;
  /** Directory containing k6 test scripts. Default: './k6' */
  testDir: string;
  /** Glob pattern for matching k6 scripts. Default: '*.k6.js' */
  testMatch: string;
  /** Endpoints to generate scripts for (when no scripts exist) */
  endpoints?: K6Endpoint[];
  /** Directory for k6 result output. Default: './k6-results' */
  outputDir: string;
}

/**
 * Parsed metric values from k6 summary JSON.
 */
export interface K6MetricValues {
  avg: number;
  min: number;
  max: number;
  med: number;
  p90: number;
  p95: number;
  p99: number;
}

/**
 * Structured metrics extracted from a k6 run.
 */
export interface K6Metrics {
  duration: K6MetricValues;
  waiting: K6MetricValues;
  connecting: K6MetricValues;
  errorRate: number;
  totalRequests: number;
  requestsPerSecond: number;
  bytesReceived: number;
  bytesSent: number;
  maxVus: number;
  totalIterations: number;
  thresholdsPassed: boolean;
  thresholdDetails: Record<string, boolean>;
}

/**
 * Raw result from a k6 execution.
 */
export interface K6ExecutionResult {
  exitCode: number;
  summary: Record<string, unknown>;
  output: string;
  error: string;
}
