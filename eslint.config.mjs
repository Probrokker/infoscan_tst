// ESLint flat-config для Next.js 15 + TypeScript strict + jsx-a11y + import.
// Документация: https://eslint.org/docs/latest/use/configure/configuration-files-new

import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'pagefind/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:jsx-a11y/recommended'),
  {
    rules: {
      // Никаких циклических импортов.
      'import/no-cycle': ['error', { maxDepth: 10 }],
      // Только именованные реэкспорты (barrel-файлы с export * ломают tree-shaking).
      'import/no-default-export': 'off',
      // Запрет any.
      '@typescript-eslint/no-explicit-any': 'error',
      // Запрет ts-ignore без обоснования.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      // Неиспользуемые переменные — только с префиксом _.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Консольные логи в коде запрещены, кроме console.warn / console.error.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // React 19 + Next 15: импорт React больше не обязателен.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // a11y: alt у изображений обязателен.
      'jsx-a11y/alt-text': 'error',
    },
  },
  {
    // Конфигурационные и серверные файлы — расслабленные правила.
    files: ['*.config.{ts,mjs,js}', 'scripts/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // MDX-файлы — отдельные правила парсинга при необходимости.
    files: ['**/*.mdx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
