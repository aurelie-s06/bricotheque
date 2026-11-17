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
  minifigs: {
    index: typeof routes['minifigs.index']
    show: typeof routes['minifigs.show']
  }
  search: typeof routes['search']
  locale: {
    switch: typeof routes['locale.switch']
  }
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  password: {
    forgot: typeof routes['password.forgot']
    send: typeof routes['password.send']
    reset: typeof routes['password.reset']
    update: typeof routes['password.update']
  }
  account: {
    show: typeof routes['account.show']
    updateProfile: typeof routes['account.update_profile']
    updatePassword: typeof routes['account.update_password']
    destroy: typeof routes['account.destroy']
  }
}
