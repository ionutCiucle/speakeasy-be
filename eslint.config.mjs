import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['services/*/src/**/*.ts', 'packages/*/src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
];
