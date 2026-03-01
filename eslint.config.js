import { configPkg } from '@adonisjs/eslint-config'

export default configPkg(
  {
    ignores: ['docs/.vitepress/cache/**'],
  },
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
    },
  }
)
