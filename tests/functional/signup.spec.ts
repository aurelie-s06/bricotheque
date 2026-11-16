import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Signup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an account with a username', async ({ client, assert }) => {
    const response = await client
      .post('/inscription')
      .form({
        username: 'brickfan',
        email: 'brickfan@example.com',
        password: 'secret-password',
        passwordConfirmation: 'secret-password',
      })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')

    const user = await User.findByOrFail('email', 'brickfan@example.com')
    assert.equal(user.username, 'brickfan')
    assert.notEqual(user.password, 'secret-password')
  })
})
