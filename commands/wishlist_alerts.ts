import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import WishlistAlerts from '#services/wishlist_alerts'

/**
 * Sends the wishlist alerts (sets that came out or leave the shops soon).
 * Run at the end of `sync:all`; can also be run by hand.
 */
export default class WishlistAlertsCommand extends BaseCommand {
  static commandName = 'wishlist:alerts'
  static description = 'Email the members whose wishlist sets came out or leave the shops soon'
  static options: CommandOptions = { startApp: true }

  async run() {
    const sent = await WishlistAlerts.run()
    this.logger.success(`Alertes wishlist : ${sent} e-mail(s) envoyé(s)`)
  }
}
