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

router.get('/', [controllers.Home, 'index']).as('home')

/**
 * Public catalogue
 */
router.get('sets', [controllers.Sets, 'index']).as('sets.index')
router.get('sets/:ref', [controllers.Sets, 'show']).as('sets.show')
router.get('themes', [controllers.Themes, 'index']).as('themes.index')
router.get('themes/:slug', [controllers.Themes, 'show']).as('themes.show')

/**
 * Global search: sets only for now (minifigs come with step 6)
 */
router
  .get('recherche', ({ request, response }) => {
    const q = String(request.input('q', '')).trim().slice(0, 100)
    return response.redirect().toRoute('sets.index', {}, { qs: q ? { q } : {} })
  })
  .as('search')

/**
 * Authentication (reworked in step 7)
 */
router
  .group(() => {
    router.get('inscription', [controllers.NewAccount, 'create'])
    router.post('inscription', [controllers.NewAccount, 'store'])

    router.get('connexion', [controllers.Session, 'create'])
    router.post('connexion', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('deconnexion', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
