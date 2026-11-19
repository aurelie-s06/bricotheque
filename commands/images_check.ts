import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ImageHealth, { NIGHTLY_LIMIT } from '#services/admin/image_health'

/**
 * Checks the pictures of the catalogue (never checked first, then those
 * checked more than 30 days ago). Run each night by `sync:all`.
 */
export default class ImagesCheck extends BaseCommand {
  static commandName = 'images:check'
  static description = 'Check that the catalogue pictures still exist'
  static options: CommandOptions = { startApp: true }

  @flags.number({ description: 'Number of pictures to check', default: NIGHTLY_LIMIT })
  declare limit: number

  @flags.boolean({ description: 'Check every picture, even the recently checked ones' })
  declare all: boolean

  async run() {
    const stats = await ImageHealth.run({
      limit: this.all ? undefined : this.limit,
      all: this.all,
      onProgress: (progress) => {
        if (progress.checked % 1000 === 0 && progress.checked > 0) {
          this.logger.info(`${progress.checked} / ${progress.total} images vérifiées`)
        }
      },
    })
    this.logger.success(
      `Images : ${stats.checked} vérifiée(s), ${stats.broken} cassée(s), ${stats.unknown} sans réponse`
    )
  }
}
