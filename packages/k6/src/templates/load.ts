import type { K6Config } from '../types';
import { generateEndpointBlock, generateHandleSummary, generateThresholds } from './index';

/**
 * Generate a constant-VU load test script.
 */
export function generateLoadScript(config: K6Config): string {
  const thresholds = generateThresholds(config.thresholds);
  const endpoints = generateEndpointBlock(config.endpoints ?? [], config.baseURL ?? '');

  return `import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  vus: ${config.vus},
  duration: '${config.duration}',
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
