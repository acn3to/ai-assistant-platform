import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@ai-platform/shared$': '<rootDir>/src/__mocks__/@ai-platform/shared.ts',
  },
  collectCoverageFrom: ['src/use-cases/**/*.ts', '!src/use-cases/__tests__/**'],
  coverageThreshold: { global: { lines: 80 } },
};

export default config;
