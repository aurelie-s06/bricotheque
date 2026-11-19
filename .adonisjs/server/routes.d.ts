import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'sets.index': { paramsTuple?: []; params?: {} }
    'sets.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'themes.index': { paramsTuple?: []; params?: {} }
    'themes.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'minifigs.index': { paramsTuple?: []; params?: {} }
    'minifigs.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'pages.about': { paramsTuple?: []; params?: {} }
    'pages.legal': { paramsTuple?: []; params?: {} }
    'pages.privacy': { paramsTuple?: []; params?: {} }
    'pages.terms': { paramsTuple?: []; params?: {} }
    'pages.site_map': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap.index': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'email.pending': { paramsTuple?: []; params?: {} }
    'email.resend': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.send': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'account.show': { paramsTuple?: []; params?: {} }
    'account.update_username': { paramsTuple?: []; params?: {} }
    'account.update_email': { paramsTuple?: []; params?: {} }
    'account.update_password': { paramsTuple?: []; params?: {} }
    'account.destroy': { paramsTuple?: []; params?: {} }
    'account.add_owned_minifigs': { paramsTuple?: []; params?: {} }
    'account.minifig_prompt': { paramsTuple?: []; params?: {} }
    'account.update_preferences': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'collection.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'wishlist.share': { paramsTuple?: []; params?: {} }
    'wishlist.unshare': { paramsTuple?: []; params?: {} }
    'collection.acquire': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'collection.add_set_minifigs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.set_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.minifig_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.toggle': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue,'status': ParamValue} }
    'wishlist.shared': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.health': { paramsTuple?: []; params?: {} }
    'admin.health.brickset': { paramsTuple?: []; params?: {} }
    'admin.health.email': { paramsTuple?: []; params?: {} }
    'admin.health.clearLog': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.confirmation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.manual': { paramsTuple?: []; params?: {} }
    'admin.manual.create': { paramsTuple?: []; params?: {} }
    'admin.manual.store': { paramsTuple: [ParamValue]; params: {'kind': ParamValue} }
    'admin.manual.merge': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.images': { paramsTuple?: []; params?: {} }
    'admin.images.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.images.update': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.images.broken': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue.update': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue.release': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.translations': { paramsTuple?: []; params?: {} }
    'admin.translations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.updates': { paramsTuple?: []; params?: {} }
    'admin.updates.store': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'sets.index': { paramsTuple?: []; params?: {} }
    'sets.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'themes.index': { paramsTuple?: []; params?: {} }
    'themes.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'minifigs.index': { paramsTuple?: []; params?: {} }
    'minifigs.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'pages.about': { paramsTuple?: []; params?: {} }
    'pages.legal': { paramsTuple?: []; params?: {} }
    'pages.privacy': { paramsTuple?: []; params?: {} }
    'pages.terms': { paramsTuple?: []; params?: {} }
    'pages.site_map': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap.index': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'email.pending': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'account.show': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'collection.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'wishlist.shared': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.health': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.manual': { paramsTuple?: []; params?: {} }
    'admin.manual.create': { paramsTuple?: []; params?: {} }
    'admin.images': { paramsTuple?: []; params?: {} }
    'admin.images.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.translations': { paramsTuple?: []; params?: {} }
    'admin.updates': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'sets.index': { paramsTuple?: []; params?: {} }
    'sets.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'themes.index': { paramsTuple?: []; params?: {} }
    'themes.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'minifigs.index': { paramsTuple?: []; params?: {} }
    'minifigs.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'pages.about': { paramsTuple?: []; params?: {} }
    'pages.legal': { paramsTuple?: []; params?: {} }
    'pages.privacy': { paramsTuple?: []; params?: {} }
    'pages.terms': { paramsTuple?: []; params?: {} }
    'pages.site_map': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap.index': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'email.pending': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'account.show': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'collection.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'wishlist.shared': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.stats': { paramsTuple?: []; params?: {} }
    'admin.health': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.manual': { paramsTuple?: []; params?: {} }
    'admin.manual.create': { paramsTuple?: []; params?: {} }
    'admin.images': { paramsTuple?: []; params?: {} }
    'admin.images.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.translations': { paramsTuple?: []; params?: {} }
    'admin.updates': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'email.resend': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.send': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'account.add_owned_minifigs': { paramsTuple?: []; params?: {} }
    'account.minifig_prompt': { paramsTuple?: []; params?: {} }
    'wishlist.share': { paramsTuple?: []; params?: {} }
    'wishlist.unshare': { paramsTuple?: []; params?: {} }
    'collection.acquire': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'collection.add_set_minifigs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.toggle': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue,'status': ParamValue} }
    'admin.health.brickset': { paramsTuple?: []; params?: {} }
    'admin.health.email': { paramsTuple?: []; params?: {} }
    'admin.health.clearLog': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'admin.users.confirmation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.manual.store': { paramsTuple: [ParamValue]; params: {'kind': ParamValue} }
    'admin.manual.merge': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.images.broken': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue.release': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.updates.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'account.update_username': { paramsTuple?: []; params?: {} }
    'account.update_email': { paramsTuple?: []; params?: {} }
    'account.update_password': { paramsTuple?: []; params?: {} }
    'account.update_preferences': { paramsTuple?: []; params?: {} }
    'collection.set_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.minifig_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.images.update': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.catalogue.update': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'admin.translations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'account.destroy': { paramsTuple?: []; params?: {} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}