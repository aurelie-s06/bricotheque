import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

/**
 * Gives (or removes) the administrator role: `node ace user:make-admin <email>`.
 */
export default class UserMakeAdmin extends BaseCommand {
  static commandName = 'user:make-admin'
  static description = 'Give the back office rights to a user (by email)'
  static help = [
    '{{ binaryName }} user:make-admin aurelie@example.com',
    '{{ binaryName }} user:make-admin aurelie@example.com --remove',
  ]

  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Email address of the account' })
  declare email: string

  @flags.boolean({ description: 'Remove the administrator role instead' })
  declare remove: boolean

  async run() {
    const remove = this.remove === true
    const user = await User.findBy('email', this.email.trim().toLowerCase())
    if (!user) {
      this.logger.error(`Aucun compte avec l'adresse ${this.email}`)
      this.exitCode = 1
      return
    }
    user.isAdmin = !remove
    await user.save()
    this.logger.success(
      remove
        ? `${user.username} n'est plus administrateur·rice`
        : `${user.username} est maintenant administrateur·rice : le back office est sur /admin`
    )
  }
}
