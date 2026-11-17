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
router
  .group(() => {
    router.get('inscription', [controllers.NewAccount, 'create']).as('new_account.create')
    router
      .post('inscription', [controllers.NewAccount, 'store'])
      .as('new_account.store')
      .use(signupThrottle)

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
      .put('mon-compte/profil', [controllers.Account, 'updateProfile'])
      .as('account.update_profile')
    router
      .put('mon-compte/mot-de-passe', [controllers.Account, 'updatePassword'])
      .as('account.update_password')
    router.delete('mon-compte', [controllers.Account, 'destroy']).as('account.destroy')
  })
  .use(middleware.auth())
