import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import UserSet from '#models/user_set'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { PASSWORD, createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

test.group('My account', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('changes the username without the password', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client
      .put('/mon-compte/profil')
      .loginAs(user)
      .form({ username: 'new_name', email: 'fan@example.com' })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/mon-compte')
    response.assertFlashMessage('success', 'Ton profil a été mis à jour.')
    await user.refresh()
    assert.equal(user.username, 'new_name')
  })

  test('changing the email requires the current password', async ({ client, assert }) => {
    const user = await createUser()

    const withoutPassword = await client
      .put('/mon-compte/profil')
      .loginAs(user)
      .form({ username: 'fan', email: 'new@example.com' })
      .withCsrfToken()
      .redirects(0)
    assert.equal(
      firstError(formErrors(withoutPassword).currentPassword),
      'Saisis ton mot de passe actuel pour changer d’adresse e-mail.'
    )

    const wrongPassword = await client
      .put('/mon-compte/profil')
      .loginAs(user)
      .form({ username: 'fan', email: 'new@example.com', currentPassword: 'nope nope nope' })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(wrongPassword).currentPassword), 'Mot de passe incorrect.')
    await user.refresh()
    assert.equal(user.email, 'fan@example.com')

    await client
      .put('/mon-compte/profil')
      .loginAs(user)
      .form({ username: 'fan', email: 'New@Example.com', currentPassword: PASSWORD })
      .withCsrfToken()
    await user.refresh()
    assert.equal(user.email, 'new@example.com')
  })

  test('the username and email of another user cannot be taken', async ({ client, assert }) => {
    await createUser({ email: 'other@example.com', username: 'other' })
    const user = await createUser()
    const response = await client
      .put('/mon-compte/profil')
      .loginAs(user)
      .form({ username: 'other', email: 'other@example.com', currentPassword: PASSWORD })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(response).username), 'Ce pseudo est déjà pris.')
    assert.equal(
      firstError(formErrors(response).email),
      'Un compte existe déjà avec cette adresse e-mail.'
    )
  })

  test('changes the password with the current one', async ({ client, assert }) => {
    const user = await createUser()
    const wrong = await client
      .put('/mon-compte/mot-de-passe')
      .loginAs(user)
      .form({
        currentPassword: 'nope nope nope',
        password: 'another long password',
        passwordConfirmation: 'another long password',
      })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(wrong).currentPassword), 'Mot de passe incorrect.')

    const response = await client
      .put('/mon-compte/mot-de-passe')
      .loginAs(user)
      .form({
        currentPassword: PASSWORD,
        password: 'another long password',
        passwordConfirmation: 'another long password',
      })
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage('success', 'Ton mot de passe a été modifié.')
    await user.refresh()
    assert.isTrue(await hash.verify(user.password, 'another long password'))
  })

  test('deletes the account and its collection after confirmation', async ({ client, assert }) => {
    await seedCatalogue()
    const user = await createUser()
    const set = await db.from('sets').where('set_num', '75192-1').firstOrFail()
    await UserSet.create({ userId: user.id, setId: set.id, status: 'owned' })

    const wrong = await client
      .delete('/mon-compte')
      .loginAs(user)
      .form({ password: 'nope nope nope' })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(wrong).deletePassword), 'Mot de passe incorrect.')
    assert.isNotNull(await User.find(user.id))

    const response = await client
      .delete('/mon-compte')
      .loginAs(user)
      .form({ password: PASSWORD })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/')
    response.assertFlashMessage('success', 'Ton compte et ta collection ont été supprimés.')
    assert.isNull(await User.find(user.id))
    assert.lengthOf(await UserSet.query().where('user_id', user.id), 0)
  })
})
