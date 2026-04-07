import { defineConfig } from '@playwright/test';
import path from 'path';

const REACT_DIR = path.resolve(import.meta.dirname, '../react');

export default defineConfig({
  timeout: 60000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      threshold: 0.1,
    },
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    { command: 'pnpm run start -- --port 5173', port: 5173, reuseExistingServer: true, cwd: path.join(REACT_DIR, 'bpm') },
    { command: 'pnpm run start -- --port 5174', port: 5174, reuseExistingServer: true, cwd: path.join(REACT_DIR, 'generic-builder') },
    { command: 'pnpm run start -- --port 5175', port: 5175, reuseExistingServer: true, cwd: path.join(REACT_DIR, 'mapper') },
    { command: 'pnpm run start -- --port 5176', port: 5176, reuseExistingServer: true, cwd: path.join(REACT_DIR, 'timer-builder') },
    { command: 'pnpm run start -- --port 5177', port: 5177, reuseExistingServer: true, cwd: path.join(REACT_DIR, 'bpm-merge-split') },
    { command: 'npx vite --port 5178', url: 'http://localhost:5178', reuseExistingServer: true, cwd: path.join(REACT_DIR, 'dmn'), stdout: 'pipe', stderr: 'pipe' },
  ],
  projects: [
    {
      name: 'bpm-baseline',
      use: { baseURL: 'http://localhost:5173' },
      testDir: './bpm/tests',
      testMatch: 'baselines.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'bpm-interactions',
      use: { baseURL: 'http://localhost:5173' },
      testDir: './bpm/tests',
      testMatch: 'interactions.spec.ts',
    },
    {
      name: 'bpm-characterization',
      use: { baseURL: 'http://localhost:5173' },
      testDir: './bpm/tests/characterization',
      testMatch: '*.spec.ts',
    },
    {
      name: 'bpm-regression',
      use: { baseURL: 'http://localhost:5173' },
      testDir: './bpm/tests',
      testMatch: 'regression.spec.ts',
    },
    {
      name: 'dmn-baseline',
      use: { baseURL: 'http://localhost:5178' },
      testDir: './dmn/tests',
      testMatch: 'baselines.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'dmn-regression',
      use: { baseURL: 'http://localhost:5178' },
      testDir: './dmn/tests',
      testMatch: 'regression.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'generic-builder',
      use: { baseURL: 'http://localhost:5174' },
      testDir: './satellite/tests',
      testMatch: 'generic-builder.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'mapper',
      use: { baseURL: 'http://localhost:5175' },
      testDir: './satellite/tests',
      testMatch: 'mapper.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'timer-builder',
      use: { baseURL: 'http://localhost:5176' },
      testDir: './satellite/tests',
      testMatch: 'timer-builder.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
    {
      name: 'bpm-merge-split',
      use: { baseURL: 'http://localhost:5177' },
      testDir: './satellite/tests',
      testMatch: 'bpm-merge-split.spec.ts',
      snapshotPathTemplate: '{testDir}/../snapshots/{testFileName}/{arg}{ext}',
    },
  ],
});
