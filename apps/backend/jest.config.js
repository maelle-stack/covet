/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve the workspace package to its TS source so ts-jest transforms it.
    '^@covet/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
  },
};
