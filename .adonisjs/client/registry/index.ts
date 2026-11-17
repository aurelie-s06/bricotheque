/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'sets.index': {
    methods: ["GET","HEAD"],
    pattern: '/sets',
    tokens: [[0,"sets"]],
    types: placeholder as Registry['sets.index']['types'],
  },
  'sets.show': {
    methods: ["GET","HEAD"],
    pattern: '/sets/:ref',
    tokens: [[0,"sets"],[1,"ref"]],
    types: placeholder as Registry['sets.show']['types'],
  },
  'themes.index': {
    methods: ["GET","HEAD"],
    pattern: '/themes',
    tokens: [[0,"themes"]],
    types: placeholder as Registry['themes.index']['types'],
  },
  'themes.show': {
    methods: ["GET","HEAD"],
    pattern: '/themes/:slug',
    tokens: [[0,"themes"],[1,"slug"]],
    types: placeholder as Registry['themes.show']['types'],
  },
  'minifigs.index': {
    methods: ["GET","HEAD"],
    pattern: '/minifigs',
    tokens: [[0,"minifigs"]],
    types: placeholder as Registry['minifigs.index']['types'],
  },
  'minifigs.show': {
    methods: ["GET","HEAD"],
    pattern: '/minifigs/:ref',
    tokens: [[0,"minifigs"],[1,"ref"]],
    types: placeholder as Registry['minifigs.show']['types'],
  },
  'search': {
    methods: ["GET","HEAD"],
    pattern: '/recherche',
    tokens: [[0,"recherche"]],
    types: placeholder as Registry['search']['types'],
  },
  'locale.switch': {
    methods: ["GET","HEAD"],
    pattern: '/langue/:locale',
    tokens: [[0,"langue"],[1,"locale"]],
    types: placeholder as Registry['locale.switch']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/inscription',
    tokens: [[0,"inscription"]],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/inscription',
    tokens: [[0,"inscription"]],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/connexion',
    tokens: [[0,"connexion"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/connexion',
    tokens: [[0,"connexion"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'password.forgot': {
    methods: ["GET","HEAD"],
    pattern: '/mot-de-passe-oublie',
    tokens: [[0,"mot-de-passe-oublie"]],
    types: placeholder as Registry['password.forgot']['types'],
  },
  'password.send': {
    methods: ["POST"],
    pattern: '/mot-de-passe-oublie',
    tokens: [[0,"mot-de-passe-oublie"]],
    types: placeholder as Registry['password.send']['types'],
  },
  'password.reset': {
    methods: ["GET","HEAD"],
    pattern: '/mot-de-passe/reinitialiser/:token',
    tokens: [[0,"mot-de-passe"],[0,"reinitialiser"],[1,"token"]],
    types: placeholder as Registry['password.reset']['types'],
  },
  'password.update': {
    methods: ["POST"],
    pattern: '/mot-de-passe/reinitialiser/:token',
    tokens: [[0,"mot-de-passe"],[0,"reinitialiser"],[1,"token"]],
    types: placeholder as Registry['password.update']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/deconnexion',
    tokens: [[0,"deconnexion"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'account.show': {
    methods: ["GET","HEAD"],
    pattern: '/mon-compte',
    tokens: [[0,"mon-compte"]],
    types: placeholder as Registry['account.show']['types'],
  },
  'account.update_profile': {
    methods: ["PUT"],
    pattern: '/mon-compte/profil',
    tokens: [[0,"mon-compte"],[0,"profil"]],
    types: placeholder as Registry['account.update_profile']['types'],
  },
  'account.update_password': {
    methods: ["PUT"],
    pattern: '/mon-compte/mot-de-passe',
    tokens: [[0,"mon-compte"],[0,"mot-de-passe"]],
    types: placeholder as Registry['account.update_password']['types'],
  },
  'account.destroy': {
    methods: ["DELETE"],
    pattern: '/mon-compte',
    tokens: [[0,"mon-compte"]],
    types: placeholder as Registry['account.destroy']['types'],
  },
  'account.update_preferences': {
    methods: ["PUT"],
    pattern: '/mon-compte/preferences',
    tokens: [[0,"mon-compte"],[0,"preferences"]],
    types: placeholder as Registry['account.update_preferences']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/tableau-de-bord',
    tokens: [[0,"tableau-de-bord"]],
    types: placeholder as Registry['dashboard']['types'],
  },
  'collection.index': {
    methods: ["GET","HEAD"],
    pattern: '/ma-collection',
    tokens: [[0,"ma-collection"]],
    types: placeholder as Registry['collection.index']['types'],
  },
  'collection.export': {
    methods: ["GET","HEAD"],
    pattern: '/ma-collection/export.csv',
    tokens: [[0,"ma-collection"],[0,"export.csv"]],
    types: placeholder as Registry['collection.export']['types'],
  },
  'wishlist.index': {
    methods: ["GET","HEAD"],
    pattern: '/ma-wishlist',
    tokens: [[0,"ma-wishlist"]],
    types: placeholder as Registry['wishlist.index']['types'],
  },
  'wishlist.share': {
    methods: ["POST"],
    pattern: '/ma-wishlist/partage',
    tokens: [[0,"ma-wishlist"],[0,"partage"]],
    types: placeholder as Registry['wishlist.share']['types'],
  },
  'wishlist.unshare': {
    methods: ["POST"],
    pattern: '/ma-wishlist/partage/desactiver',
    tokens: [[0,"ma-wishlist"],[0,"partage"],[0,"desactiver"]],
    types: placeholder as Registry['wishlist.unshare']['types'],
  },
  'collection.acquire': {
    methods: ["POST"],
    pattern: '/collection/:kind/:id/acquired',
    tokens: [[0,"collection"],[1,"kind"],[1,"id"],[0,"acquired"]],
    types: placeholder as Registry['collection.acquire']['types'],
  },
  'collection.add_set_minifigs': {
    methods: ["POST"],
    pattern: '/collection/sets/:id/minifigs',
    tokens: [[0,"collection"],[0,"sets"],[1,"id"],[0,"minifigs"]],
    types: placeholder as Registry['collection.add_set_minifigs']['types'],
  },
  'collection.set_details': {
    methods: ["PUT"],
    pattern: '/collection/sets/:id/details',
    tokens: [[0,"collection"],[0,"sets"],[1,"id"],[0,"details"]],
    types: placeholder as Registry['collection.set_details']['types'],
  },
  'collection.minifig_details': {
    methods: ["PUT"],
    pattern: '/collection/minifigs/:id/details',
    tokens: [[0,"collection"],[0,"minifigs"],[1,"id"],[0,"details"]],
    types: placeholder as Registry['collection.minifig_details']['types'],
  },
  'collection.toggle': {
    methods: ["POST"],
    pattern: '/collection/:kind/:id/:status',
    tokens: [[0,"collection"],[1,"kind"],[1,"id"],[1,"status"]],
    types: placeholder as Registry['collection.toggle']['types'],
  },
  'wishlist.shared': {
    methods: ["GET","HEAD"],
    pattern: '/wishlist/:token',
    tokens: [[0,"wishlist"],[1,"token"]],
    types: placeholder as Registry['wishlist.shared']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
