import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(
  // macOS AppleDouble files created on exFAT/FAT volumes
  { ignores: ['**/._*'] },
  ...react
)
