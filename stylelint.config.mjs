const stylelintConfig = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind-директивы: @tailwind, @apply, @layer, @theme, @plugin, @variant.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'screen',
          'variants',
          'responsive',
          'theme',
          'plugin',
          'variant',
          'utility',
          'reference',
        ],
      },
    ],
    // CSS-переменные с произвольной формой имени (для дизайн-токенов).
    'custom-property-pattern': null,
    // Селекторы с data-атрибутами — допускаем стиль с тире.
    'selector-class-pattern': null,
    // С Tailwind встречается короткий формат RGB — не предупреждаем.
    'color-function-notation': 'modern',
    // Не требуем reset в начале строки длинных значений.
    'value-keyword-case': null,
  },
  ignoreFiles: ['node_modules/**/*', '.next/**/*', 'out/**/*', 'build/**/*', 'public/**/*'],
}

export default stylelintConfig
