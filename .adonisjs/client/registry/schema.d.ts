/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
    }
  }
  'sets.index': {
    methods: ["GET","HEAD"]
    pattern: '/sets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['index']>>>
    }
  }
  'sets.show': {
    methods: ["GET","HEAD"]
    pattern: '/sets/:ref'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ref: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sets_controller').default['show']>>>
    }
  }
  'news.current': {
    methods: ["GET","HEAD"]
    pattern: '/nouveautes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
    }
  }
  'news.month': {
    methods: ["GET","HEAD"]
    pattern: '/nouveautes/:month'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { month: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/news_controller').default['show']>>>
    }
  }
  'themes.index': {
    methods: ["GET","HEAD"]
    pattern: '/themes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['index']>>>
    }
  }
  'themes.show': {
    methods: ["GET","HEAD"]
    pattern: '/themes/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/themes_controller').default['show']>>>
    }
  }
  'minifigs.index': {
    methods: ["GET","HEAD"]
    pattern: '/minifigs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['index']>>>
    }
  }
  'minifigs.show': {
    methods: ["GET","HEAD"]
    pattern: '/minifigs/:ref'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ref: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/minifigs_controller').default['show']>>>
    }
  }
  'pages.about': {
    methods: ["GET","HEAD"]
    pattern: '/a-propos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['about']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['about']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['about']>>>
    }
  }
  'pages.legal': {
    methods: ["GET","HEAD"]
    pattern: '/mentions-legales'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['legal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['legal']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['legal']>>>
    }
  }
  'pages.privacy': {
    methods: ["GET","HEAD"]
    pattern: '/confidentialite'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['privacy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['privacy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['privacy']>>>
    }
  }
  'pages.terms': {
    methods: ["GET","HEAD"]
    pattern: '/conditions-utilisation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['terms']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['terms']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['terms']>>>
    }
  }
  'pages.site_map': {
    methods: ["GET","HEAD"]
    pattern: '/plan-du-site'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['siteMap']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['siteMap']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/pages_controller').default['siteMap']>>>
    }
  }
  'robots': {
    methods: ["GET","HEAD"]
    pattern: '/robots.txt'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['robots']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['robots']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['robots']>>>
    }
  }
  'sitemap.index': {
    methods: ["GET","HEAD"]
    pattern: '/sitemap.xml'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['index']>>>
    }
  }
  'sitemap.show': {
    methods: ["GET","HEAD"]
    pattern: '/sitemaps/:name.xml'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/sitemap_controller').default['show']>>>
    }
  }
  'search': {
    methods: ["GET","HEAD"]
    pattern: '/recherche'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/search_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/search_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/search_controller').default['index']>>>
    }
  }
  'locale.switch': {
    methods: ["GET","HEAD"]
    pattern: '/langue/:locale'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { locale: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'email.verify': {
    methods: ["GET","HEAD"]
    pattern: '/inscription/confirmer/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['verify']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['verify']>>>
    }
  }
  'new_account.create': {
    methods: ["GET","HEAD"]
    pattern: '/inscription'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
    }
  }
  'new_account.store': {
    methods: ["POST"]
    pattern: '/inscription'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'email.pending': {
    methods: ["GET","HEAD"]
    pattern: '/inscription/confirmation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['pending']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['pending']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['pending']>>>
    }
  }
  'email.resend': {
    methods: ["POST"]
    pattern: '/inscription/renvoyer'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['resend']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['resend']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['resend']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/connexion'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/connexion'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password.forgot': {
    methods: ["GET","HEAD"]
    pattern: '/mot-de-passe-oublie'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['create']>>>
    }
  }
  'password.send': {
    methods: ["POST"]
    pattern: '/mot-de-passe-oublie'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password.reset': {
    methods: ["GET","HEAD"]
    pattern: '/mot-de-passe/reinitialiser/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['edit']>>>
    }
  }
  'password.update': {
    methods: ["POST"]
    pattern: '/mot-de-passe/reinitialiser/:token'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/deconnexion'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'account.show': {
    methods: ["GET","HEAD"]
    pattern: '/mon-compte'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['show']>>>
    }
  }
  'account.update_username': {
    methods: ["PUT"]
    pattern: '/mon-compte/pseudo'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUsernameValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUsernameValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateUsername']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateUsername']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateUsername']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.update_email': {
    methods: ["PUT"]
    pattern: '/mon-compte/email'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateEmail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateEmail']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateEmail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.update_password': {
    methods: ["PUT"]
    pattern: '/mon-compte/mot-de-passe'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updatePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updatePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.destroy': {
    methods: ["DELETE"]
    pattern: '/mon-compte'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').deleteAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').deleteAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.add_owned_minifigs': {
    methods: ["POST"]
    pattern: '/mon-compte/minifigs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['addOwnedMinifigs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['addOwnedMinifigs']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['addOwnedMinifigs']>>>
    }
  }
  'account.minifig_prompt': {
    methods: ["POST"]
    pattern: '/mon-compte/minifigs/proposition'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['answerMinifigPrompt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['answerMinifigPrompt']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['answerMinifigPrompt']>>>
    }
  }
  'wishlist_alerts.prompt': {
    methods: ["POST"]
    pattern: '/mon-compte/alertes/proposition'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['answerPrompt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['answerPrompt']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['answerPrompt']>>>
    }
  }
  'account.update_preferences': {
    methods: ["PUT"]
    pattern: '/mon-compte/preferences'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collection').preferencesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/collection').preferencesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePreferences']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePreferences']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updatePreferences']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/tableau-de-bord'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['show']>>>
    }
  }
  'collection.index': {
    methods: ["GET","HEAD"]
    pattern: '/ma-collection'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['collection']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['collection']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['collection']>>>
    }
  }
  'wishlist.index': {
    methods: ["GET","HEAD"]
    pattern: '/ma-wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['wishlist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['wishlist']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['wishlist']>>>
    }
  }
  'collection.missing_minifigs': {
    methods: ["GET","HEAD"]
    pattern: '/ma-collection/minifigs-manquantes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['missingMinifigs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['missingMinifigs']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['missingMinifigs']>>>
    }
  }
  'collection.add_missing_minifigs': {
    methods: ["POST"]
    pattern: '/ma-collection/minifigs-manquantes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['addMissingMinifigs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['addMissingMinifigs']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['addMissingMinifigs']>>>
    }
  }
  'wishlist.share': {
    methods: ["POST"]
    pattern: '/ma-wishlist/partage'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['share']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['share']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['share']>>>
    }
  }
  'wishlist.unshare': {
    methods: ["POST"]
    pattern: '/ma-wishlist/partage/desactiver'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['unshare']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['unshare']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['unshare']>>>
    }
  }
  'collection.quick_add': {
    methods: ["POST"]
    pattern: '/collection/ajout-rapide'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collection').quickAddValidator)>|InferInput<(typeof import('#helpers/locale').resolveLocale)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/collection').quickAddValidator)>|InferInput<(typeof import('#helpers/locale').resolveLocale)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['quickAdd']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['quickAdd']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['quickAdd']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'collection.acquire': {
    methods: ["POST"]
    pattern: '/collection/:kind/:id/acquired'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['acquire']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['acquire']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['acquire']>>>
    }
  }
  'collection.add_set_minifigs': {
    methods: ["POST"]
    pattern: '/collection/sets/:id/minifigs'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['addSetMinifigs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['addSetMinifigs']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['addSetMinifigs']>>>
    }
  }
  'collection.set_details': {
    methods: ["PUT"]
    pattern: '/collection/sets/:id/details'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collection').setDetailsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collection').setDetailsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateSetDetails']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateSetDetails']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateSetDetails']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'collection.minifig_details': {
    methods: ["PUT"]
    pattern: '/collection/minifigs/:id/details'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/collection').minifigDetailsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/collection').minifigDetailsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateMinifigDetails']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateMinifigDetails']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['updateMinifigDetails']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'collection.toggle': {
    methods: ["POST"]
    pattern: '/collection/:kind/:id/:status'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue; status: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['toggle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['toggle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/collection_actions_controller').default['toggle']>>>
    }
  }
  'wishlist.shared': {
    methods: ["GET","HEAD"]
    pattern: '/wishlist/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['shared']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['shared']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/my_collection_controller').default['shared']>>>
    }
  }
  'wishlist_alerts.unsubscribe': {
    methods: ["GET","HEAD"]
    pattern: '/alertes-wishlist/desinscription/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['unsubscribe']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['unsubscribe']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/wishlist_alerts_controller').default['unsubscribe']>>>
    }
  }
  'admin.dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['dashboard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['dashboard']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['dashboard']>>>
    }
  }
  'admin.stats': {
    methods: ["GET","HEAD"]
    pattern: '/admin/statistiques'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/stats_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/stats_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/stats_controller').default['index']>>>
    }
  }
  'admin.health': {
    methods: ["GET","HEAD"]
    pattern: '/admin/sante'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['index']>>>
    }
  }
  'admin.health.brickset': {
    methods: ["POST"]
    pattern: '/admin/sante/brickset'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['brickset']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['brickset']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['brickset']>>>
    }
  }
  'admin.health.email': {
    methods: ["POST"]
    pattern: '/admin/sante/email'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['email']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['email']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['email']>>>
    }
  }
  'admin.health.clearLog': {
    methods: ["POST"]
    pattern: '/admin/sante/journaux/:name/vider'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['clearLog']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['clearLog']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/health_controller').default['clearLog']>>>
    }
  }
  'admin.users': {
    methods: ["GET","HEAD"]
    pattern: '/admin/utilisateurs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['index']>>>
    }
  }
  'admin.users.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/utilisateurs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['show']>>>
    }
  }
  'admin.users.confirmation': {
    methods: ["POST"]
    pattern: '/admin/utilisateurs/:id/confirmation'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['resendConfirmation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['resendConfirmation']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['resendConfirmation']>>>
    }
  }
  'admin.users.role': {
    methods: ["PUT"]
    pattern: '/admin/utilisateurs/:id/role'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateRole']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateRole']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['updateRole']>>>
    }
  }
  'admin.users.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/utilisateurs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/users_controller').default['destroy']>>>
    }
  }
  'admin.manual': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajouts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['index']>>>
    }
  }
  'admin.manual.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/ajouts/nouveau'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['create']>>>
    }
  }
  'admin.manual.store': {
    methods: ["POST"]
    pattern: '/admin/ajouts/:kind'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { kind: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['store']>>>
    }
  }
  'admin.manual.merge': {
    methods: ["POST"]
    pattern: '/admin/ajouts/:kind/:id/fusion'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['merge']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['merge']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/manual_controller').default['merge']>>>
    }
  }
  'admin.images': {
    methods: ["GET","HEAD"]
    pattern: '/admin/images'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['index']>>>
    }
  }
  'admin.images.check': {
    methods: ["POST"]
    pattern: '/admin/images/verification'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['checkAll']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['checkAll']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['checkAll']>>>
    }
  }
  'admin.images.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/images/:kind/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['edit']>>>
    }
  }
  'admin.images.update': {
    methods: ["PUT"]
    pattern: '/admin/images/:kind/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['update']>>>
    }
  }
  'admin.images.broken': {
    methods: ["POST"]
    pattern: '/admin/images/:kind/:id/cassee'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['reportBroken']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['reportBroken']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/images_controller').default['reportBroken']>>>
    }
  }
  'admin.catalogue': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalogue'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['index']>>>
    }
  }
  'admin.catalogue.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalogue/:kind/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['edit']>>>
    }
  }
  'admin.catalogue.update': {
    methods: ["PUT"]
    pattern: '/admin/catalogue/:kind/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['update']>>>
    }
  }
  'admin.catalogue.release': {
    methods: ["POST"]
    pattern: '/admin/catalogue/:kind/:id/liberer'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { kind: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['release']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['release']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['release']>>>
    }
  }
  'admin.translations': {
    methods: ["GET","HEAD"]
    pattern: '/admin/traductions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['index']>>>
    }
  }
  'admin.translations.update': {
    methods: ["PUT"]
    pattern: '/admin/traductions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['update']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/translations_controller').default['update']>>>
    }
  }
  'admin.updates': {
    methods: ["GET","HEAD"]
    pattern: '/admin/mises-a-jour'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['index']>>>
    }
  }
  'admin.updates.store': {
    methods: ["POST"]
    pattern: '/admin/mises-a-jour'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin/updates_controller').default['store']>>>
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
