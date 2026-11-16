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

router.on('/').renderInertia('home', {}).as('home')

/**
 * Global search (placeholder until the catalogue is imported)
 */
router
  .get('recherche', ({ request, inertia }) => {
    const q = String(request.input('q', '')).trim().slice(0, 100)
    return inertia.render('search', { q })
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
