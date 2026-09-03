export default {
  rootDir: '..',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/lambda.js',
    '!src/config/**/*.js',
    '!src/application/ports/**/*.js',
    '!src/observability/telemetry/**/*.js',
    // Static seed catalog with combinatorial normalization fallbacks; not business logic.
    '!src/infrastructure/repositories/InMemoryProductRepository.js',
  ],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/tests/'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  transform: {},
};
