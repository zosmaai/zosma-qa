import type { TestResult } from '@zosmaai/zosma-qa-core';
import type { K6Metrics, K6MetricValues } from './types';

/**
 * Extract a metric's percentile values from k6 summary data.
 */
function extractMetric(metrics: Record<string, unknown>, name: string): K6MetricValues {
  const metric = metrics[name];
  if (metric && typeof metric === 'object') {
    const m = metric as Record<string, unknown>;
    const values = (m.values ?? m) as Record<string, number>;
    return {
      avg: values.avg ?? 0,
      min: values.min ?? 0,
      max: values.max ?? 0,
      med: values.med ?? 0,
      p90: values['p(90)'] ?? 0,
      p95: values['p(95)'] ?? 0,
      p99: values['p(99)'] ?? 0,
    };
  }
  return { avg: 0, min: 0, max: 0, med: 0, p90: 0, p95: 0, p99: 0 };
}

function extractCount(metrics: Record<string, unknown>, name: string, field: string): number {
  const metric = metrics[name];
  if (metric && typeof metric === 'object') {
    const m = metric as Record<string, unknown>;
    const values = (m.values ?? m) as Record<string, number>;
    return values[field] ?? 0;
  }
  return 0;
}

/**
 * Parse raw k6 summary JSON into structured metrics.
 */
export function parseK6Summary(raw: Record<string, unknown>): K6Metrics {
  const metrics = (raw.metrics ?? raw) as Record<string, unknown>;

  // Request failure rate
  let errorRate = 0;
  const failed = metrics.http_req_failed;
  if (failed && typeof failed === 'object') {
    const f = failed as Record<string, unknown>;
    const values = (f.values ?? f) as Record<string, number>;
    errorRate = values.rate ?? values.value ?? 0;
  }

  // Check threshold results
  let thresholdsPassed = true;
  const thresholdDetails: Record<string, boolean> = {};
  for (const [metricName, metricData] of Object.entries(metrics)) {
    if (metricData && typeof metricData === 'object') {
      const m = metricData as Record<string, unknown>;
      if (m.thresholds && typeof m.thresholds === 'object') {
        for (const [thresholdName, thresholdOk] of Object.entries(
          m.thresholds as Record<string, unknown>,
        )) {
          const ok = Boolean(thresholdOk);
          thresholdDetails[`${metricName}.${thresholdName}`] = ok;
          if (!ok) thresholdsPassed = false;
        }
      }
    }
  }

  return {
    duration: extractMetric(metrics, 'http_req_duration'),
    waiting: extractMetric(metrics, 'http_req_waiting'),
    connecting: extractMetric(metrics, 'http_req_connecting'),
    errorRate,
    totalRequests: extractCount(metrics, 'http_reqs', 'count'),
    requestsPerSecond: extractCount(metrics, 'http_reqs', 'rate'),
    bytesReceived: extractCount(metrics, 'data_received', 'count'),
    bytesSent: extractCount(metrics, 'data_sent', 'count'),
    maxVus: extractCount(metrics, 'vus', 'max') || extractCount(metrics, 'vus', 'value'),
    totalIterations: extractCount(metrics, 'iterations', 'count'),
    thresholdsPassed,
    thresholdDetails,
  };
}

/**
 * Convert k6 metrics into normalized TestResult array.
 */
export function toTestResults(
  scriptName: string,
  metrics: K6Metrics,
  exitCode: number,
  wallClockMs: number,
): TestResult[] {
  const passed = metrics.thresholdsPassed && exitCode === 0;

  const result: TestResult = {
    name: scriptName,
    status: passed ? 'passed' : 'failed',
    duration: wallClockMs,
  };

  if (!passed) {
    const failedThresholds = Object.entries(metrics.thresholdDetails)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);

    if (failedThresholds.length > 0) {
      result.error = `Thresholds failed: ${failedThresholds.join(', ')}`;
    } else if (exitCode !== 0) {
      result.error = `k6 exited with code ${exitCode}`;
    }
  }

  return [result];
}
