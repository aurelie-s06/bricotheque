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
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.update_password': { paramsTuple?: []; params?: {} }
    'account.destroy': { paramsTuple?: []; params?: {} }
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
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'email.resend': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.send': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'wishlist.share': { paramsTuple?: []; params?: {} }
    'wishlist.unshare': { paramsTuple?: []; params?: {} }
    'collection.acquire': { paramsTuple: [ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue} }
    'collection.add_set_minifigs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.toggle': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'kind': ParamValue,'id': ParamValue,'status': ParamValue} }
  }
  PUT: {
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.update_password': { paramsTuple?: []; params?: {} }
    'account.update_preferences': { paramsTuple?: []; params?: {} }
    'collection.set_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'collection.minifig_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'account.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}