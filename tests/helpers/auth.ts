import { DateTime } from 'luxon'
import limiter from '@adonisjs/limiter/services/main'
import User from '#models/user'

export const PASSWORD = 'correct horse battery'

export async function createUser(
  overrides: Partial<{
    email: string
    username: string
    password: string
    emailVerifiedAt: DateTime | null
  }> = {}
) {
  return User.create({
    email: 'fan@example.com',
    username: 'fan',
    password: PASSWORD,
    emailVerifiedAt: DateTime.now(),
    ...overrides,
  })
}

/** Rate limits are kept in memory during the tests: reset them between tests */
export function resetRateLimits() {
  return limiter.clear(['memory'])
}

/** Error messages sent back to the form */
export function formErrors(response: { flashMessages(): Record<string, any> }) {
  return (response.flashMessages().inputErrorsBag ?? {}) as Record<string, string | string[]>
}

export function firstError(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
