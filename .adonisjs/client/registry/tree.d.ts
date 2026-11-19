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
  pages: {
    about: typeof routes['pages.about']
    legal: typeof routes['pages.legal']
    privacy: typeof routes['pages.privacy']
    terms: typeof routes['pages.terms']
    siteMap: typeof routes['pages.site_map']
  }
  robots: typeof routes['robots']
  sitemap: {
    index: typeof routes['sitemap.index']
    show: typeof routes['sitemap.show']
  }
  search: typeof routes['search']
  locale: {
    switch: typeof routes['locale.switch']
  }
  email: {
    verify: typeof routes['email.verify']
    pending: typeof routes['email.pending']
    resend: typeof routes['email.resend']
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
    updateUsername: typeof routes['account.update_username']
    updateEmail: typeof routes['account.update_email']
    updatePassword: typeof routes['account.update_password']
    destroy: typeof routes['account.destroy']
    updatePreferences: typeof routes['account.update_preferences']
  }
  dashboard: typeof routes['dashboard']
  collection: {
    index: typeof routes['collection.index']
    acquire: typeof routes['collection.acquire']
    addSetMinifigs: typeof routes['collection.add_set_minifigs']
    setDetails: typeof routes['collection.set_details']
    minifigDetails: typeof routes['collection.minifig_details']
    toggle: typeof routes['collection.toggle']
  }
  wishlist: {
    index: typeof routes['wishlist.index']
    share: typeof routes['wishlist.share']
    unshare: typeof routes['wishlist.unshare']
    shared: typeof routes['wishlist.shared']
  }
  admin: {
    dashboard: typeof routes['admin.dashboard']
    users: typeof routes['admin.users'] & {
      show: typeof routes['admin.users.show']
      confirmation: typeof routes['admin.users.confirmation']
      role: typeof routes['admin.users.role']
      destroy: typeof routes['admin.users.destroy']
    }
    images: typeof routes['admin.images'] & {
      edit: typeof routes['admin.images.edit']
      update: typeof routes['admin.images.update']
      broken: typeof routes['admin.images.broken']
    }
    catalogue: typeof routes['admin.catalogue'] & {
      edit: typeof routes['admin.catalogue.edit']
      update: typeof routes['admin.catalogue.update']
      release: typeof routes['admin.catalogue.release']
    }
    translations: typeof routes['admin.translations'] & {
      update: typeof routes['admin.translations.update']
    }
    updates: typeof routes['admin.updates'] & {
      store: typeof routes['admin.updates.store']
    }
  }
}
