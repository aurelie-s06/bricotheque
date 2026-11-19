/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { isLocale, LOCALE_COOKIE, safeReturnPath } from '#helpers/locale'
import { forgotPasswordThrottle, signupThrottle } from '#start/limiter'

router.get('/', [controllers.Home, 'index']).as('home')

/**
 * Public catalogue
 */
router.get('sets', [controllers.Sets, 'index']).as('sets.index')
router.get('sets/:ref', [controllers.Sets, 'show']).as('sets.show')
router.get('themes', [controllers.Themes, 'index']).as('themes.index')
router.get('themes/:slug', [controllers.Themes, 'show']).as('themes.show')

router.get('minifigs', [controllers.Minifigs, 'index']).as('minifigs.index')
router.get('minifigs/:ref', [controllers.Minifigs, 'show']).as('minifigs.show')

/**
 * Information pages, robots.txt and sitemaps
 */
router.get('a-propos', [controllers.Pages, 'about']).as('pages.about')
router.get('mentions-legales', [controllers.Pages, 'legal']).as('pages.legal')
router.get('confidentialite', [controllers.Pages, 'privacy']).as('pages.privacy')
router.get('conditions-utilisation', [controllers.Pages, 'terms']).as('pages.terms')
router.get('plan-du-site', [controllers.Pages, 'siteMap']).as('pages.site_map')
router.get('robots.txt', [controllers.Sitemap, 'robots']).as('robots')
router.get('sitemap.xml', [controllers.Sitemap, 'index']).as('sitemap.index')
router.get('sitemaps/:name.xml', [controllers.Sitemap, 'show']).as('sitemap.show')

/**
 * Global search (header): sets and minifigs
 */
router.get('recherche', [controllers.Search, 'index']).as('search')

/**
 * Language switcher: remembers the choice in a cookie for one year, then
 * goes back to the page. A GET link, so it works without JavaScript.
 */
router
  .get('langue/:locale', ({ params, request, response }) => {
    if (isLocale(params.locale)) {
      response.plainCookie(LOCALE_COOKIE, params.locale, {
        maxAge: '1y',
        sameSite: 'lax',
        httpOnly: true,
      })
    }
    // clearQs: the return URL has its own query string, do not forward ours
    return response
      .redirect()
      .clearQs()
      .toPath(safeReturnPath(request.input('retour')))
  })
  .as('locale.switch')

/**
 * Accounts
 */
// Signed link of the confirmation email (works logged in or not)
router.get('inscription/confirmer/:id', [controllers.NewAccount, 'verify']).as('email.verify')

router
  .group(() => {
    router.get('inscription', [controllers.NewAccount, 'create']).as('new_account.create')
    router
      .post('inscription', [controllers.NewAccount, 'store'])
      .as('new_account.store')
      .use(signupThrottle)
    router.get('inscription/confirmation', [controllers.NewAccount, 'pending']).as('email.pending')
    router
      .post('inscription/renvoyer', [controllers.NewAccount, 'resend'])
      .as('email.resend')
      .use(forgotPasswordThrottle)

    router.get('connexion', [controllers.Session, 'create']).as('session.create')
    router.post('connexion', [controllers.Session, 'store']).as('session.store')

    router.get('mot-de-passe-oublie', [controllers.PasswordReset, 'create']).as('password.forgot')
    router
      .post('mot-de-passe-oublie', [controllers.PasswordReset, 'store'])
      .as('password.send')
      .use(forgotPasswordThrottle)
    router
      .get('mot-de-passe/reinitialiser/:token', [controllers.PasswordReset, 'edit'])
      .as('password.reset')
    router
      .post('mot-de-passe/reinitialiser/:token', [controllers.PasswordReset, 'update'])
      .as('password.update')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('deconnexion', [controllers.Session, 'destroy']).as('session.destroy')

    router.get('mon-compte', [controllers.Account, 'show']).as('account.show')
    router
      .put('mon-compte/pseudo', [controllers.Account, 'updateUsername'])
      .as('account.update_username')
    router.put('mon-compte/email', [controllers.Account, 'updateEmail']).as('account.update_email')
    router
      .put('mon-compte/mot-de-passe', [controllers.Account, 'updatePassword'])
      .as('account.update_password')
    router.delete('mon-compte', [controllers.Account, 'destroy']).as('account.destroy')
    router
      .put('mon-compte/preferences', [controllers.Account, 'updatePreferences'])
      .as('account.update_preferences')

    // Collection and wishlist
    router.get('tableau-de-bord', [controllers.Dashboard, 'show']).as('dashboard')
    router.get('ma-collection', [controllers.MyCollection, 'collection']).as('collection.index')
    router.get('ma-wishlist', [controllers.MyCollection, 'wishlist']).as('wishlist.index')
    router.post('ma-wishlist/partage', [controllers.MyCollection, 'share']).as('wishlist.share')
    router
      .post('ma-wishlist/partage/desactiver', [controllers.MyCollection, 'unshare'])
      .as('wishlist.unshare')

    router
      .post('collection/:kind/:id/acquired', [controllers.CollectionActions, 'acquire'])
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
      .as('collection.acquire')
    router
      .post('collection/sets/:id/minifigs', [controllers.CollectionActions, 'addSetMinifigs'])
      .where('id', router.matchers.number())
      .as('collection.add_set_minifigs')
    router
      .put('collection/sets/:id/details', [controllers.CollectionActions, 'updateSetDetails'])
      .where('id', router.matchers.number())
      .as('collection.set_details')
    router
      .put('collection/minifigs/:id/details', [
        controllers.CollectionActions,
        'updateMinifigDetails',
      ])
      .where('id', router.matchers.number())
      .as('collection.minifig_details')
    router
      .post('collection/:kind/:id/:status', [controllers.CollectionActions, 'toggle'])
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
      .where('status', /^(owned|wanted)$/)
      .as('collection.toggle')
  })
  .use(middleware.auth())

/**
 * Shared wishlist (public, read-only)
 */
router.get('wishlist/:token', [controllers.MyCollection, 'shared']).as('wishlist.shared')

/**
 * Back office (administrators only: 404 for everyone else)
 */
router
  .group(() => {
    router.get('/', [controllers.admin.Admin, 'dashboard']).as('admin.dashboard')
    router.get('statistiques', [controllers.admin.Stats, 'index']).as('admin.stats')
    router.get('utilisateurs', [controllers.admin.Users, 'index']).as('admin.users')
    router.get('utilisateurs/:id', [controllers.admin.Users, 'show']).as('admin.users.show')
    router
      .post('utilisateurs/:id/confirmation', [controllers.admin.Users, 'resendConfirmation'])
      .as('admin.users.confirmation')
    router
      .put('utilisateurs/:id/role', [controllers.admin.Users, 'updateRole'])
      .as('admin.users.role')
    router
      .delete('utilisateurs/:id', [controllers.admin.Users, 'destroy'])
      .as('admin.users.destroy')
    router.get('ajouts', [controllers.admin.Manual, 'index']).as('admin.manual')
    router.get('ajouts/nouveau', [controllers.admin.Manual, 'create']).as('admin.manual.create')
    router
      .post('ajouts/:kind', [controllers.admin.Manual, 'store'])
      .as('admin.manual.store')
      .where('kind', /^(sets|minifigs)$/)
    router
      .post('ajouts/:kind/:id/fusion', [controllers.admin.Manual, 'merge'])
      .as('admin.manual.merge')
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
    router.get('images', [controllers.admin.Images, 'index']).as('admin.images')
    router.get('images/:kind/:id', [controllers.admin.Images, 'edit']).as('admin.images.edit')
    router.put('images/:kind/:id', [controllers.admin.Images, 'update']).as('admin.images.update')
    router
      .post('images/:kind/:id/cassee', [controllers.admin.Images, 'reportBroken'])
      .as('admin.images.broken')
    router.get('catalogue', [controllers.admin.Catalogue, 'index']).as('admin.catalogue')
    router
      .get('catalogue/:kind/:id', [controllers.admin.Catalogue, 'edit'])
      .as('admin.catalogue.edit')
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
    router
      .put('catalogue/:kind/:id', [controllers.admin.Catalogue, 'update'])
      .as('admin.catalogue.update')
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
    router
      .post('catalogue/:kind/:id/liberer', [controllers.admin.Catalogue, 'release'])
      .as('admin.catalogue.release')
      .where('kind', /^(sets|minifigs)$/)
      .where('id', router.matchers.number())
    router.get('traductions', [controllers.admin.Translations, 'index']).as('admin.translations')
    router
      .put('traductions/:id', [controllers.admin.Translations, 'update'])
      .as('admin.translations.update')
    router.get('mises-a-jour', [controllers.admin.Updates, 'index']).as('admin.updates')
    router.post('mises-a-jour', [controllers.admin.Updates, 'store']).as('admin.updates.store')
  })
  .prefix('admin')
  .use([middleware.auth(), middleware.admin()])
