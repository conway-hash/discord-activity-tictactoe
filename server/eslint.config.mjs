import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore folders and test files globally
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.js'],
  },

  // Recommended JS/TS rules for all js/ts files
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },

  // For JS files, set sourceType to commonjs (since server uses CommonJS)
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
  },

  // For other JS/TS files, set Node globals and latest ecmaVersion
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module', // default to module for TS and .mjs
      },
    },
  },

  // Add TypeScript ESLint recommended rules
  tseslint.configs.recommended,
]);
