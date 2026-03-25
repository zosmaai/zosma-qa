import type { K6Config, K6Endpoint, K6Stage, K6Threshold } from '../types';
import { generateLoadScript } from './load';
import { generateSoakScript } from './soak';
import { generateSpikeScript } from './spike';
import { generateStressScript } from './stress';

/**
 * Generate a k6 test script based on the config's testType.
 */
export function generateScript(config: K6Config): string {
  switch (config.testType) {
    case 'stress':
      return generateStressScript(config);
    case 'spike':
      return generateSpikeScript(config);
    case 'soak':
      return generateSoakScript(config);
    default:
      return generateLoadScript(config);
  }
}

/**
 * Format thresholds for k6 options block.
 */
export function generateThresholds(thresholds: K6Threshold[]): string {
  return thresholds.map((t) => `    '${t.metric}': ['${t.condition}'],`).join('\n');
}

/**
 * Format stages for k6 options block.
 */
export function generateStages(stages: K6Stage[]): string {
  return stages.map((s) => `    { duration: '${s.duration}', target: ${s.target} },`).join('\n');
}

/**
 * Generate the default function body with endpoint requests and checks.
 */
export function generateEndpointBlock(endpoints: K6Endpoint[], _baseURL: string): string {
  if (endpoints.length === 0) {
    return `  const res = http.get(BASE_URL);\n  check(res, {\n    'status is 200': (r) => r.status === 200,\n  });\n`;
  }

  return endpoints
    .map((ep) => {
      const method = ep.method.toUpperCase();
      const methodLower = ep.method.toLowerCase();
      const lines: string[] = [];

      lines.push(`  // --- ${method} ${ep.path} ---`);
      lines.push(`  {`);
      lines.push(`    const url = \`\${BASE_URL}${ep.path}\`;`);

      if (ep.headers && Object.keys(ep.headers).length > 0) {
        const headerEntries = Object.entries(ep.headers)
          .map(([k, v]) => `      '${k}': '${v}',`)
          .join('\n');
        lines.push(`    const params = {\n      headers: {\n${headerEntries}\n      },\n    };`);
      } else {
        lines.push(`    const params = {};`);
      }

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (ep.body) {
          lines.push(`    const payload = JSON.stringify(${JSON.stringify(ep.body)});`);
          lines.push(`    if (!params.headers) params.headers = {};`);
          lines.push(`    params.headers['Content-Type'] = 'application/json';`);
          lines.push(`    const res = http.${methodLower}(url, payload, params);`);
        } else {
          lines.push(`    const res = http.${methodLower}(url, null, params);`);
        }
      } else if (method === 'DELETE') {
        lines.push(`    const res = http.del(url, null, params);`);
      } else {
        lines.push(`    const res = http.${methodLower}(url, params);`);
      }

      lines.push(`    check(res, {`);
      lines.push(`      '${method} ${ep.path} status 200': (r) => r.status === 200,`);
      lines.push(`      '${method} ${ep.path} duration < 500ms': (r) => r.timings.duration < 500,`);
      lines.push(`    });`);
      lines.push(`  }`);

      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Generate the handleSummary export for collecting JSON results.
 */
export function generateHandleSummary(): string {
  return `export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'summary.json';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}`;
}
