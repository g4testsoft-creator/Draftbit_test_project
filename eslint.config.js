/**
 * Flat ESLint config (ESLint v9+) for Expo SDK 54.
 *
 * - `eslint-config-expo/flat` is the official Expo preset (React,
 *   React Native, TypeScript, react-hooks, import order, JSX a11y).
 * - `eslint-plugin-prettier/recommended` surfaces Prettier formatting
 *   diffs as ESLint warnings so `npm run lint` covers style too.
 */
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  ...expoConfig,
  prettierRecommended,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'ios/**',
      'android/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      '*.d.ts',
    ],
  },
  {
    rules: {
      'prettier/prettier': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    },
  },
];
