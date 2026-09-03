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
    files: ['src/tests/**/*.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      'max-lines-per-function': 'off',
    },
  },
];
