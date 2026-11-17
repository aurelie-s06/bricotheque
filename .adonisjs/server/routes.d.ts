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
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
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
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'sets.index': { paramsTuple?: []; params?: {} }
    'sets.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'themes.index': { paramsTuple?: []; params?: {} }
    'themes.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'minifigs.index': { paramsTuple?: []; params?: {} }
    'minifigs.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'account.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'sets.index': { paramsTuple?: []; params?: {} }
    'sets.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'themes.index': { paramsTuple?: []; params?: {} }
    'themes.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'minifigs.index': { paramsTuple?: []; params?: {} }
    'minifigs.show': { paramsTuple: [ParamValue]; params: {'ref': ParamValue} }
    'search': { paramsTuple?: []; params?: {} }
    'locale.switch': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'account.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.send': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.update_password': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'account.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}