// Root ESLint flat config shared by every workspace.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/src/generated/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // A leading underscore marks a value that is deliberately unused, e.g. a field
      // destructured away: `const { id: _id, ...rest } = vehicle`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Fast refresh only works when a module exports components and nothing else.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Must stay last: turns off stylistic rules that would fight Prettier.
  prettier,
);
