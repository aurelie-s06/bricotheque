import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import PasswordReset from '#services/password_reset'
import ResetPasswordNotification from '#mails/reset_password_notification'
import { createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

const NEW_PASSWORD = 'a brand new password'

test.group('Forgot password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => {
    const { mails } = mail.fake()
    return () => {
      mails.clear?.()
      mail.restore()
    }
  })

  test('sends a reset link to an existing account', async ({ client, assert }) => {
    const user = await createUser()
    const fake = mail.fake()

    const response = await client
      .post('/mot-de-passe-oublie')
      .form({ email: 'fan@example.com' })
      .withCsrfToken()
      .redirects(0)
    response.assertStatus(302)
    response.assertFlashMessage(
      'success',
      'Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.'
    )

    fake.mails.assertSent(ResetPasswordNotification, ({ message }) => {
      message.assertTo(user.email)
      message.assertSubject('Réinitialisation de ton mot de passe')
      return String(message.toJSON().message.text).includes('/mot-de-passe/reinitialiser/')
    })

    const tokens = await db.from('password_reset_tokens').where('user_id', user.id)
    assert.lengthOf(tokens, 1)
    assert.lengthOf(tokens[0].token_hash, 64) // only a SHA-256 is stored
  })

  test('answers the same way for an unknown email, without sending anything', async ({
    client,
  }) => {
    const fake = mail.fake()
    const response = await client
      .post('/mot-de-passe-oublie')
      .form({ email: 'nobody@example.com' })
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage(
      'success',
      'Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.'
    )
    fake.mails.assertNoneSent()
  })

  test('the email is in English for English visitors', async ({ client }) => {
    await createUser()
    const fake = mail.fake()
    await client
      .post('/mot-de-passe-oublie')
      .withPlainCookie('locale', 'en')
      .form({ email: 'fan@example.com' })
      .withCsrfToken()
    fake.mails.assertSent(ResetPasswordNotification, ({ message }) => {
      message.assertSubject('Reset your password')
      return true
    })
  })
})

test.group('Reset password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('a valid link lets the user choose a new password, once', async ({ client, assert }) => {
    const user = await createUser()
    const token = await PasswordReset.createToken(user)

    const page = await client.get(`/mot-de-passe/reinitialiser/${token}`).withInertia()
    assert.deepEqual(page.inertiaProps.valid, true)

    const response = await client
      .post(`/mot-de-passe/reinitialiser/${token}`)
      .form({ password: NEW_PASSWORD, passwordConfirmation: NEW_PASSWORD })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/connexion')
    response.assertFlashMessage('success', 'Ton mot de passe a été modifié. Tu peux te connecter.')

    await user.refresh()
    assert.isTrue(await hash.verify(user.password, NEW_PASSWORD))

    const reused = await client.get(`/mot-de-passe/reinitialiser/${token}`).withInertia()
    assert.isFalse(reused.inertiaProps.valid)
  })

  test('expired or unknown links are refused', async ({ client, assert }) => {
    const user = await createUser()
    const token = await PasswordReset.createToken(user)
    await db
      .from('password_reset_tokens')
      .update({ expires_at: DateTime.utc().minus({ minutes: 1 }).toSQL({ includeOffset: false }) })

    for (const value of [token, 'not-a-real-token']) {
      const page = await client.get(`/mot-de-passe/reinitialiser/${value}`).withInertia()
      assert.isFalse(page.inertiaProps.valid)

      const response = await client
        .post(`/mot-de-passe/reinitialiser/${value}`)
        .form({ password: NEW_PASSWORD, passwordConfirmation: NEW_PASSWORD })
        .withCsrfToken()
        .redirects(0)
      response.assertHeader('location', '/mot-de-passe-oublie')
    }
    await user.refresh()
    assert.isFalse(await hash.verify(user.password, NEW_PASSWORD))
  })

  test('the new password must be valid too', async ({ client, assert }) => {
    const token = await PasswordReset.createToken(await createUser())
    const response = await client
      .post(`/mot-de-passe/reinitialiser/${token}`)
      .form({ password: 'short', passwordConfirmation: 'short' })
      .withCsrfToken()
      .redirects(0)
    assert.match(firstError(formErrors(response).password)!, /au moins 10 caractères/)
  })
})
