/**
 * Supported browser types for test execution.
 */
export type Browser = 'chromium' | 'firefox' | 'webkit';

/**
 * Supported AI coding loops for Playwright agent initialisation.
 */
export type AgentLoop = 'opencode' | 'claude' | 'vscode';

/**
 * Root zosma-qa configuration (zosma.config.ts).
 */
export interface ZosmaConfig {
  /** Active test runner plugins. Default: ['playwright'] */
  plugins: string[];
  /** Directory where test files live. Default: './tests' */
  testDir: string;
  /** Reporters to use. Default: ['html', 'list'] */
  reporters: string[];
  /** Base URL of the app under test */
  baseURL?: string;
  /** Browsers to run tests against */
  browsers?: Browser[];
}

/**
 * Plugin interface — every test runner must implement this.
 * Future plugins: @zosma-qa/k6, @zosma-qa/artillery, @zosma-qa/rest
 */
export interface ZosmaPlugin {
  /** Unique plugin identifier, e.g. 'playwright' */
  name: string;
  /** Execute the test suite */
  run(config: RunnerConfig): Promise<TestResult[]>;
  /** Optional: generate/open a report after the run */
  report?(results: TestResult[]): Promise<void>;
}

/**
 * Configuration passed to a plugin's run() method.
 */
export interface RunnerConfig {
  testDir: string;
  baseURL?: string;
  browsers: Browser[];
  reporters: string[];
  ci: boolean;
  /** Extra args to forward to the underlying runner */
  extraArgs?: string[];
}

/**
 * Normalised result from any test runner.
 */
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  retries?: number;
}

/**
 * Summary of a full test run.
 */
export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}
