import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import EmailVerification from '#services/email_verification'
import { AccountExistsMail, ConfirmEmailMail } from '#mails/account_mails'
import { PASSWORD, createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

const signupData = (overrides: Record<string, string> = {}) => ({
  username: 'brickfan',
  email: 'BrickFan@Example.com',
  password: PASSWORD,
  passwordConfirmation: PASSWORD,
  ...overrides,
})

test.group('Signup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('creates an account waiting for confirmation and sends the link', async ({
    client,
    assert,
  }) => {
    const fake = mail.fake()
    const response = await client
      .post('/inscription')
      .form(signupData())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/inscription/confirmation')

    const user = await User.findByOrFail('email', 'brickfan@example.com') // stored in lower case
    assert.equal(user.username, 'brickfan')
    assert.isNull(user.emailVerifiedAt)
    assert.notEqual(user.password, PASSWORD)
    assert.isTrue(await hash.verify(user.password, PASSWORD))
    fake.mails.assertSent(ConfirmEmailMail, ({ message }) => {
      message.assertTo('brickfan@example.com')
      return true
    })
    mail.restore()
  })

  test('the confirmation link activates the account and logs in', async ({ client, assert }) => {
    const user = await createUser({ emailVerifiedAt: null })
    const link = new URL(EmailVerification.url(user))

    const response = await client.get(link.pathname + link.search).redirects(0)
    response.assertHeader('location', '/mon-compte')
    response.assertFlashMessage(
      'success',
      'Ton adresse est confirmée. Bienvenue sur Briquothèque, fan !'
    )
    await user.refresh()
    assert.isNotNull(user.emailVerifiedAt)
  })

  test('a forged or outdated confirmation link is refused', async ({ client, assert }) => {
    const user = await createUser({ emailVerifiedAt: null })
    const link = new URL(EmailVerification.url(user))

    const forged = await client
      .get(link.pathname + link.search.replace('fan%40example.com', 'other%40example.com'))
      .redirects(0)
    forged.assertHeader('location', '/inscription/confirmation')

    user.email = 'changed@example.com'
    await user.save()
    const outdated = await client.get(link.pathname + link.search).redirects(0)
    outdated.assertHeader('location', '/inscription/confirmation')
    await user.refresh()
    assert.isNull(user.emailVerifiedAt)
  })

  test('an account waiting for confirmation cannot log in and gets the link again', async ({
    client,
    assert,
  }) => {
    const fake = mail.fake()
    await createUser({ emailVerifiedAt: null })
    const response = await client
      .post('/connexion')
      .form({ email: 'fan@example.com', password: PASSWORD })
      .withCsrfToken()
      .redirects(0)

    assert.match(firstError(formErrors(response).form)!, /pas encore activé/)
    fake.mails.assertSent(ConfirmEmailMail)
    mail.restore()
  })

  test('requires at least 10 characters and a matching confirmation', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/inscription')
      .form(signupData({ password: 'too-short', passwordConfirmation: 'different' }))
      .withCsrfToken()
      .redirects(0)

    const errors = formErrors(response)
    assert.equal(
      firstError(errors.password),
      'Le mot de passe doit contenir au moins 10 caractères.'
    )
    assert.equal(
      firstError(errors.passwordConfirmation),
      'Les deux mots de passe ne sont pas identiques.'
    )
    assert.isNull(await User.findBy('username', 'brickfan'))
  })

  test('a taken email is not revealed: its owner gets an email instead', async ({
    client,
    assert,
  }) => {
    const fake = mail.fake()
    await createUser({ email: 'brickfan@example.com', username: 'brickfan' })

    const taken = await client
      .post('/inscription')
      .form(signupData({ username: 'someone-else' }))
      .withCsrfToken()
      .redirects(0)
    taken.assertHeader('location', '/inscription/confirmation')
    assert.isUndefined(formErrors(taken).email)
    assert.isNull(await User.findBy('username', 'someone-else'))
    fake.mails.assertSent(AccountExistsMail, ({ message }) => {
      message.assertTo('brickfan@example.com')
      return true
    })
    fake.mails.assertNotSent(ConfirmEmailMail)
    mail.restore()
  })

  test('refuses a taken username and an invalid username', async ({ client, assert }) => {
    await createUser({ email: 'brickfan@example.com', username: 'brickfan' })

    const taken = await client
      .post('/inscription')
      .form(signupData({ email: 'new@example.com' }))
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(taken).username), 'Ce pseudo est déjà pris.')

    const invalid = await client
      .post('/inscription')
      .form(signupData({ username: 'élodie ?', email: 'new@example.com' }))
      .withCsrfToken()
      .redirects(0)
    assert.match(firstError(formErrors(invalid).username)!, /lettres sans accent/)
  })

  test('validation messages follow the language', async ({ client, assert }) => {
    const response = await client
      .post('/inscription')
      .withPlainCookie('locale', 'en')
      .form(signupData({ password: 'short', passwordConfirmation: 'short' }))
      .withCsrfToken()
      .redirects(0)
    assert.equal(
      firstError(formErrors(response).password),
      'The password must be at least 10 characters long.'
    )
  })

  test('rejects a form without CSRF token', async ({ client, assert }) => {
    const response = await client.post('/inscription').form(signupData()).redirects(0)
    // Shield sends the visitor back to the form; nothing is created
    response.assertStatus(302)
    assert.notEqual(response.header('location'), '/mon-compte')
    assert.isNull(await User.findBy('username', 'brickfan'))
  })

  test('is limited to 5 accounts per hour and per IP address', async ({ client, assert }) => {
    for (let index = 0; index < 5; index++) {
      const response = await client
        .post('/inscription')
        .form(signupData({ username: `fan${index}`, email: `fan${index}@example.com` }))
        .withCsrfToken()
        .redirects(0)
      response.assertHeader('location', '/inscription/confirmation')
    }

    const blocked = await client
      .post('/inscription')
      .form(signupData({ username: 'fan5', email: 'fan5@example.com' }))
      .withCsrfToken()
      .redirects(0)
    blocked.assertStatus(302)
    assert.match(firstError(formErrors(blocked).form)!, /Trop de tentatives/)
    assert.isNull(await User.findBy('username', 'fan5'))
  })
})

test.group('Login and logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('logs in with the right password (email case does not matter)', async ({ client }) => {
    await createUser()
    const response = await client
      .post('/connexion')
      .form({ email: 'FAN@example.com', password: PASSWORD })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/')
    response.assertFlashMessage('success', 'Content de te revoir, fan !')
  })

  test('gives the same generic message for a wrong password or an unknown email', async ({
    client,
    assert,
  }) => {
    await createUser()
    const wrongPassword = await client
      .post('/connexion')
      .form({ email: 'fan@example.com', password: 'not the password' })
      .withCsrfToken()
      .redirects(0)
    const unknownEmail = await client
      .post('/connexion')
      .form({ email: 'nobody@example.com', password: 'not the password' })
      .withCsrfToken()
      .redirects(0)

    const message = 'Adresse e-mail ou mot de passe incorrect.'
    assert.equal(firstError(formErrors(wrongPassword).form), message)
    assert.equal(firstError(formErrors(unknownEmail).form), message)
  })

  test('blocks the account for 15 minutes after 5 failed attempts', async ({ client, assert }) => {
    await createUser()
    for (let index = 0; index < 5; index++) {
      await client
        .post('/connexion')
        .form({ email: 'fan@example.com', password: `wrong ${index}` })
        .withCsrfToken()
        .redirects(0)
    }

    // even the right password is refused while blocked
    const blocked = await client
      .post('/connexion')
      .form({ email: 'fan@example.com', password: PASSWORD })
      .withCsrfToken()
      .redirects(0)
    assert.equal(
      firstError(formErrors(blocked).form),
      'Trop de tentatives. Pour ta sécurité, réessaie dans 15 min.'
    )
  })

  test('successful logins are not limited', async ({ client }) => {
    await createUser()
    for (let index = 0; index < 7; index++) {
      const response = await client
        .post('/connexion')
        .form({ email: 'fan@example.com', password: PASSWORD })
        .withCsrfToken()
        .redirects(0)
      response.assertHeader('location', '/')
    }
  })

  test('logs out', async ({ client }) => {
    const user = await createUser()
    const response = await client.post('/deconnexion').loginAs(user).withCsrfToken().redirects(0)
    response.assertHeader('location', '/')
    response.assertFlashMessage('success', 'Tu es maintenant déconnecté·e.')
  })
})

test.group('Private pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('are refused without a session and redirect to the login page', async ({
    client,
    assert,
  }) => {
    const page = await client.get('/mon-compte').redirects(0)
    page.assertStatus(302)
    page.assertHeader('location', '/connexion')
    assert.equal(page.session()['auth.intended'] ?? page.session().auth?.intended, '/mon-compte')

    const update = await client
      .put('/mon-compte/profil')
      .form({ username: 'hacker', email: 'h@example.com' })
      .withCsrfToken()
      .redirects(0)
    update.assertHeader('location', '/connexion')
  })

  test('after logging in, the visitor goes back to the page they wanted', async ({ client }) => {
    await createUser()
    const response = await client
      .post('/connexion')
      .withSession({ auth: { intended: '/mon-compte' } })
      .form({ email: 'fan@example.com', password: PASSWORD })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/mon-compte')
  })

  test('a notification explains why the visitor must log in', async ({ client }) => {
    const privatePage = await client.get('/mon-compte').redirects(0)
    privatePage.assertFlashMessage('info', 'Connecte-toi pour accéder à cette page.')

    // Buttons of visitors: the page is remembered, the URL is cleaned
    const button = await client.get('/connexion').qs({ retour: '/sets' }).redirects(0)
    button.assertHeader('location', '/connexion')
    button.assertFlashMessage('info', 'Connecte-toi pour accéder à cette page.')
  })

  test('login and signup pages send logged-in users to the home page', async ({ client }) => {
    const user = await createUser()
    const response = await client.get('/connexion').loginAs(user).redirects(0)
    response.assertHeader('location', '/')
  })

  test('the account page shows the user', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client.get('/mon-compte').loginAs(user).withInertia()
    response.assertStatus(200)
    assert.deepInclude(response.inertiaProps.account, { username: 'fan', email: 'fan@example.com' })
    assert.equal(response.inertiaProps.user.username, 'fan')
  })
})
