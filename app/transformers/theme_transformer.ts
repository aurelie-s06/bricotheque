import type Theme from '#models/theme'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { themePath } from '#helpers/urls'

export default class ThemeTransformer extends BaseTransformer<Theme> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'slug']),
      url: themePath(this.resource),
    }
  }
}
