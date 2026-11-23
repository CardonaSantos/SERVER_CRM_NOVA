// @ts-check
// ESLint 10 (flat config). Traducción 1:1 del .eslintrc.js anterior:
// typescript-eslint recommended + prettier, sin eslint:recommended.
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', 'coverage/**'],
  },

  tseslint.configs.recommended,

  eslintPluginPrettierRecommended,

  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
);
