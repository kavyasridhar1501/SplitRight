module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 15000,
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'lib/**/*.js',
    'server.js',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov'],
};
