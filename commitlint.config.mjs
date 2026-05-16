// Conventional Commits: feat, fix, docs, chore, refactor, test, ci, perf, style, build, revert.
const commitlintConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'chore',
        'refactor',
        'test',
        'ci',
        'perf',
        'style',
        'build',
        'revert',
      ],
    ],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
  },
}

export default commitlintConfig
