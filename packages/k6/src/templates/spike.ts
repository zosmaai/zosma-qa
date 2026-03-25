import type { K6Config } from '../types';
import {
  generateEndpointBlock,
  generateHandleSummary,
  generateStages,
  generateThresholds,
} from './index';

/**
 * Generate a spike test script.
 * Warm up at 10 VUs, spike to target, hold 30s, recover.
 */
export function generateSpikeScript(config: K6Config): string {
  const thresholds = generateThresholds(config.thresholds);
  const endpoints = generateEndpointBlock(config.endpoints ?? [], config.baseURL ?? '');

  const stages = config.stages
    ? generateStages(config.stages)
    : generateStages([
        { duration: '1m', target: 10 },
        { duration: '10s', target: config.vus },
        { duration: '30s', target: config.vus },
        { duration: '10s', target: 10 },
        { duration: '1m', target: 10 },
      ]);

  return `import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  stages: [
${stages}
  ],
  thresholds: {
${thresholds}
  },
};

const BASE_URL = '${config.baseURL ?? ''}';

export default function () {
${endpoints}
  sleep(1);
}

${generateHandleSummary()}
`;
}
