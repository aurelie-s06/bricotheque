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
  'pages.about': {
    methods: ["GET","HEAD"],
    pattern: '/a-propos',
    tokens: [[0,"a-propos"]],
    types: placeholder as Registry['pages.about']['types'],
  },
  'pages.legal': {
    methods: ["GET","HEAD"],
    pattern: '/mentions-legales',
    tokens: [[0,"mentions-legales"]],
    types: placeholder as Registry['pages.legal']['types'],
  },
  'pages.privacy': {
    methods: ["GET","HEAD"],
    pattern: '/confidentialite',
    tokens: [[0,"confidentialite"]],
    types: placeholder as Registry['pages.privacy']['types'],
  },
  'pages.terms': {
    methods: ["GET","HEAD"],
    pattern: '/conditions-utilisation',
    tokens: [[0,"conditions-utilisation"]],
    types: placeholder as Registry['pages.terms']['types'],
  },
  'pages.site_map': {
    methods: ["GET","HEAD"],
    pattern: '/plan-du-site',
    tokens: [[0,"plan-du-site"]],
    types: placeholder as Registry['pages.site_map']['types'],
  },
  'robots': {
    methods: ["GET","HEAD"],
    pattern: '/robots.txt',
    tokens: [[0,"robots.txt"]],
    types: placeholder as Registry['robots']['types'],
  },
  'sitemap.index': {
    methods: ["GET","HEAD"],
    pattern: '/sitemap.xml',
    tokens: [[0,"sitemap.xml"]],
    types: placeholder as Registry['sitemap.index']['types'],
  },
  'sitemap.show': {
    methods: ["GET","HEAD"],
    pattern: '/sitemaps/:name.xml',
    tokens: [[0,"sitemaps"],[1,"name",".xml"]],
    types: placeholder as Registry['sitemap.show']['types'],
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
  'email.verify': {
    methods: ["GET","HEAD"],
    pattern: '/inscription/confirmer/:id',
    tokens: [[0,"inscription"],[0,"confirmer"],[1,"id"]],
    types: placeholder as Registry['email.verify']['types'],
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
  'email.pending': {
    methods: ["GET","HEAD"],
    pattern: '/inscription/confirmation',
    tokens: [[0,"inscription"],[0,"confirmation"]],
    types: placeholder as Registry['email.pending']['types'],
  },
  'email.resend': {
    methods: ["POST"],
    pattern: '/inscription/renvoyer',
    tokens: [[0,"inscription"],[0,"renvoyer"]],
    types: placeholder as Registry['email.resend']['types'],
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
  'account.update_username': {
    methods: ["PUT"],
    pattern: '/mon-compte/pseudo',
    tokens: [[0,"mon-compte"],[0,"pseudo"]],
    types: placeholder as Registry['account.update_username']['types'],
  },
  'account.update_email': {
    methods: ["PUT"],
    pattern: '/mon-compte/email',
    tokens: [[0,"mon-compte"],[0,"email"]],
    types: placeholder as Registry['account.update_email']['types'],
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
  'admin.dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [[0,"admin"]],
    types: placeholder as Registry['admin.dashboard']['types'],
  },
  'admin.users': {
    methods: ["GET","HEAD"],
    pattern: '/admin/utilisateurs',
    tokens: [[0,"admin"],[0,"utilisateurs"]],
    types: placeholder as Registry['admin.users']['types'],
  },
  'admin.users.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/utilisateurs/:id',
    tokens: [[0,"admin"],[0,"utilisateurs"],[1,"id"]],
    types: placeholder as Registry['admin.users.show']['types'],
  },
  'admin.users.confirmation': {
    methods: ["POST"],
    pattern: '/admin/utilisateurs/:id/confirmation',
    tokens: [[0,"admin"],[0,"utilisateurs"],[1,"id"],[0,"confirmation"]],
    types: placeholder as Registry['admin.users.confirmation']['types'],
  },
  'admin.users.role': {
    methods: ["PUT"],
    pattern: '/admin/utilisateurs/:id/role',
    tokens: [[0,"admin"],[0,"utilisateurs"],[1,"id"],[0,"role"]],
    types: placeholder as Registry['admin.users.role']['types'],
  },
  'admin.users.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/utilisateurs/:id',
    tokens: [[0,"admin"],[0,"utilisateurs"],[1,"id"]],
    types: placeholder as Registry['admin.users.destroy']['types'],
  },
  'admin.manual': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajouts',
    tokens: [[0,"admin"],[0,"ajouts"]],
    types: placeholder as Registry['admin.manual']['types'],
  },
  'admin.manual.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/ajouts/nouveau',
    tokens: [[0,"admin"],[0,"ajouts"],[0,"nouveau"]],
    types: placeholder as Registry['admin.manual.create']['types'],
  },
  'admin.manual.store': {
    methods: ["POST"],
    pattern: '/admin/ajouts/:kind',
    tokens: [[0,"admin"],[0,"ajouts"],[1,"kind"]],
    types: placeholder as Registry['admin.manual.store']['types'],
  },
  'admin.manual.merge': {
    methods: ["POST"],
    pattern: '/admin/ajouts/:kind/:id/fusion',
    tokens: [[0,"admin"],[0,"ajouts"],[1,"kind"],[1,"id"],[0,"fusion"]],
    types: placeholder as Registry['admin.manual.merge']['types'],
  },
  'admin.images': {
    methods: ["GET","HEAD"],
    pattern: '/admin/images',
    tokens: [[0,"admin"],[0,"images"]],
    types: placeholder as Registry['admin.images']['types'],
  },
  'admin.images.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/images/:kind/:id',
    tokens: [[0,"admin"],[0,"images"],[1,"kind"],[1,"id"]],
    types: placeholder as Registry['admin.images.edit']['types'],
  },
  'admin.images.update': {
    methods: ["PUT"],
    pattern: '/admin/images/:kind/:id',
    tokens: [[0,"admin"],[0,"images"],[1,"kind"],[1,"id"]],
    types: placeholder as Registry['admin.images.update']['types'],
  },
  'admin.images.broken': {
    methods: ["POST"],
    pattern: '/admin/images/:kind/:id/cassee',
    tokens: [[0,"admin"],[0,"images"],[1,"kind"],[1,"id"],[0,"cassee"]],
    types: placeholder as Registry['admin.images.broken']['types'],
  },
  'admin.catalogue': {
    methods: ["GET","HEAD"],
    pattern: '/admin/catalogue',
    tokens: [[0,"admin"],[0,"catalogue"]],
    types: placeholder as Registry['admin.catalogue']['types'],
  },
  'admin.catalogue.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/catalogue/:kind/:id',
    tokens: [[0,"admin"],[0,"catalogue"],[1,"kind"],[1,"id"]],
    types: placeholder as Registry['admin.catalogue.edit']['types'],
  },
  'admin.catalogue.update': {
    methods: ["PUT"],
    pattern: '/admin/catalogue/:kind/:id',
    tokens: [[0,"admin"],[0,"catalogue"],[1,"kind"],[1,"id"]],
    types: placeholder as Registry['admin.catalogue.update']['types'],
  },
  'admin.catalogue.release': {
    methods: ["POST"],
    pattern: '/admin/catalogue/:kind/:id/liberer',
    tokens: [[0,"admin"],[0,"catalogue"],[1,"kind"],[1,"id"],[0,"liberer"]],
    types: placeholder as Registry['admin.catalogue.release']['types'],
  },
  'admin.translations': {
    methods: ["GET","HEAD"],
    pattern: '/admin/traductions',
    tokens: [[0,"admin"],[0,"traductions"]],
    types: placeholder as Registry['admin.translations']['types'],
  },
  'admin.translations.update': {
    methods: ["PUT"],
    pattern: '/admin/traductions/:id',
    tokens: [[0,"admin"],[0,"traductions"],[1,"id"]],
    types: placeholder as Registry['admin.translations.update']['types'],
  },
  'admin.updates': {
    methods: ["GET","HEAD"],
    pattern: '/admin/mises-a-jour',
    tokens: [[0,"admin"],[0,"mises-a-jour"]],
    types: placeholder as Registry['admin.updates']['types'],
  },
  'admin.updates.store': {
    methods: ["POST"],
    pattern: '/admin/mises-a-jour',
    tokens: [[0,"admin"],[0,"mises-a-jour"]],
    types: placeholder as Registry['admin.updates.store']['types'],
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
