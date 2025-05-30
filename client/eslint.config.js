import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore node_modules, dist, build, test files globally
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.js'],
  },

  // Base JS/TS config with recommended rules
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { js },
    extends: ['js/recommended'],
  },

  // TypeScript ESLint recommended config
  tseslint.configs.recommended,

  // React plugin config for flat (with jsx-runtime automatic to avoid import React)
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { react: pluginReact },
    rules: {
      // Disable react-in-jsx-scope because React 17+ new JSX transform doesn't require import React
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
        // Tell eslint-plugin-react to use the new JSX runtime
        'jsx-runtime': 'automatic',
      },
    },
    extends: [pluginReact.configs.flat.recommended],
  },
]);
