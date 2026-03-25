import type { K6Config } from '../types';
import {
  generateEndpointBlock,
  generateHandleSummary,
  generateStages,
  generateThresholds,
} from './index';

/**
 * Generate a stress test script with ramping VUs.
 * Ramps to 50%, holds, ramps to 100%, holds, ramps down.
 */
export function generateStressScript(config: K6Config): string {
  const thresholds = generateThresholds(config.thresholds);
  const endpoints = generateEndpointBlock(config.endpoints ?? [], config.baseURL ?? '');

  const stages = config.stages
    ? generateStages(config.stages)
    : generateStages([
        { duration: '2m', target: Math.ceil(config.vus * 0.5) },
        { duration: '2m', target: Math.ceil(config.vus * 0.5) },
        { duration: '2m', target: config.vus },
        { duration: '5m', target: config.vus },
        { duration: '2m', target: 0 },
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
