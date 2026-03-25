import type { K6Config } from '../types';
import {
  generateEndpointBlock,
  generateHandleSummary,
  generateStages,
  generateThresholds,
} from './index';

/**
 * Generate a soak/endurance test script.
 * 5m ramp up, hold for duration (default 30m), 5m ramp down.
 */
export function generateSoakScript(config: K6Config): string {
  const thresholds = generateThresholds(config.thresholds);
  const endpoints = generateEndpointBlock(config.endpoints ?? [], config.baseURL ?? '');
  const holdDuration = config.duration || '30m';

  const stages = config.stages
    ? generateStages(config.stages)
    : generateStages([
        { duration: '5m', target: config.vus },
        { duration: holdDuration, target: config.vus },
        { duration: '5m', target: 0 },
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
