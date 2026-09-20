import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        Buffer: 'readonly',
        URL: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-console': 'error',
      'max-lines-per-function': ['error', 50],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/app.js', 'src/container.js'],
    rules: {
      'max-lines-per-function': ['error', 180],
      complexity: ['error', 20],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 20],
    },
  },
  {
    files: ['src/tests/**/*.js'],
    languageOptions: {
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
];
