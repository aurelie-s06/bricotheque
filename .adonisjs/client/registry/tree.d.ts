/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  sets: {
    index: typeof routes['sets.index']
    show: typeof routes['sets.show']
  }
  themes: {
    index: typeof routes['themes.index']
    show: typeof routes['themes.show']
  }
  search: typeof routes['search']
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
}
