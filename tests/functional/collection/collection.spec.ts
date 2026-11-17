import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'
import type User from '#models/user'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

const setId = async (setNum: string) => {
  const set = await BrickSet.findByOrFail('set_num', setNum)
  return set.id
}
const minifigId = async (figNum: string) => {
  const minifig = await Minifig.findByOrFail('fig_num', figNum)
  return minifig.id
}
const entriesOf = async (user: User) => {
  const sets = await UserSet.query().where('user_id', user.id).preload('set').orderBy('id')
  return sets.map((entry) => `${entry.set.setNum}:${entry.status}`)
}

test.group('Collection: buttons', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('visitors are sent to the login page', async ({ client }) => {
    const id = await setId('75192-1')
    const response = await client
      .post(`/collection/sets/${id}/owned`)
      .form({ action: 'add' })
      .withCsrfToken()
      .redirects(0)
    response.assertHeader('location', '/connexion')
  })

  test('adds and removes a set, with a message', async ({ client, assert }) => {
    const user = await createUser()
    const id = await setId('75192-1')

    const added = await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(user)
      .form({ action: 'add' })
      .withCsrfToken()
      .redirects(0)
    added.assertFlashMessage('success', '« Millennium Falcon™ » est dans ta collection.')
    assert.deepEqual(await entriesOf(user), ['75192-1:owned'])

    // adding twice does not duplicate
    await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(user)
      .form({ action: 'add' })
      .withCsrfToken()
    assert.deepEqual(await entriesOf(user), ['75192-1:owned'])

    const removed = await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(user)
      .form({ action: 'remove' })
      .withCsrfToken()
      .redirects(0)
    removed.assertFlashMessage('success', '« Millennium Falcon™ » a été retiré de ta collection.')
    assert.deepEqual(await entriesOf(user), [])
  })

  test('"Je l\'ai eu !" moves an item from the wishlist to the collection', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const id = await setId('8880-1')
    await client
      .post(`/collection/sets/${id}/wanted`)
      .loginAs(user)
      .form({ action: 'add' })
      .withCsrfToken()
    assert.deepEqual(await entriesOf(user), ['8880-1:wanted'])

    const response = await client
      .post(`/collection/sets/${id}/acquired`)
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage(
      'success',
      'Bravo ! « Super Car » passe de ta wishlist à ta collection.'
    )
    assert.deepEqual(await entriesOf(user), ['8880-1:owned'])
  })

  test('minifigs: buttons work the same way', async ({ client, assert }) => {
    const user = await createUser()
    const id = await minifigId('fig-000001')
    await client
      .post(`/collection/minifigs/${id}/wanted`)
      .loginAs(user)
      .form({ action: 'add' })
      .withCsrfToken()
    const entries = await UserMinifig.query().where('user_id', user.id)
    assert.deepEqual(
      entries.map((entry) => entry.status),
      ['wanted']
    )
  })

  test('the minifigs of a set are added when the user chose so', async ({ client, assert }) => {
    const id = await setId('75192-1')

    const without = await createUser({ email: 'a@example.com', username: 'a' })
    await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(without)
      .form({ action: 'add' })
      .withCsrfToken()
    assert.lengthOf(await UserMinifig.query().where('user_id', without.id), 0)

    const withMinifigs = await createUser({ email: 'b@example.com', username: 'b' })
    withMinifigs.autoAddMinifigs = true
    await withMinifigs.save()
    const response = await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(withMinifigs)
      .form({ action: 'add' })
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage(
      'success',
      '« Millennium Falcon™ » est dans ta collection, avec 3 minifig(s) du set.'
    )
    const minifigs = await UserMinifig.query().where('user_id', withMinifigs.id).preload('minifig')
    assert.sameDeepMembers(
      minifigs.map((entry) => [entry.minifig.figNum, entry.quantity, entry.status]),
      [
        ['fig-000001', 1, 'owned'],
        ['fig-000002', 1, 'owned'],
        ['fig-000003', 2, 'owned'],
      ]
    )
  })

  test('the minifigs of an owned set can be added on demand, without duplicates', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const id = await setId('75192-1')
    await UserMinifig.create({
      userId: user.id,
      minifigId: await minifigId('fig-000001'),
      status: 'owned',
      quantity: 5,
    })

    const response = await client
      .post(`/collection/sets/${id}/minifigs`)
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage('success', '2 minifig(s) du set ajoutée(s) à ta collection.')
    const han = await UserMinifig.query()
      .where({ userId: user.id, minifigId: await minifigId('fig-000001') })
      .firstOrFail()
    assert.equal(han.quantity, 5) // kept as it was
  })

  test('unknown items return 404', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/collection/sets/999999/owned')
      .loginAs(user)
      .form({ action: 'add' })
      .withCsrfToken()
    response.assertStatus(404)
  })

  test('every page knows what the visitor owns and wants', async ({ client, assert }) => {
    const user = await createUser()
    await UserSet.create({ userId: user.id, setId: await setId('75192-1'), status: 'owned' })
    await UserSet.create({ userId: user.id, setId: await setId('8880-1'), status: 'wanted' })

    const member = await client.get('/sets').loginAs(user).withInertia()
    assert.deepEqual(member.inertiaProps.collectionIds, {
      ownedSets: [await setId('75192-1')],
      wantedSets: [await setId('8880-1')],
      ownedMinifigs: [],
      wantedMinifigs: [],
    })

    const guest = await client.get('/sets').withInertia()
    assert.isNull(guest.inertiaProps.collectionIds)
  })
})

test.group('Collection: details of an owned item', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('quantity, condition, price, date and note of an owned set', async ({ client, assert }) => {
    const user = await createUser()
    const id = await setId('75192-1')
    await UserSet.create({ userId: user.id, setId: id, status: 'owned' })

    const response = await client
      .put(`/collection/sets/${id}/details`)
      .loginAs(user)
      .form({
        quantity: '2',
        condition: 'sealed',
        purchasePrice: '799.5',
        purchaseDate: '2023-11-24',
        note: 'Cadeau',
      })
      .withCsrfToken()
      .redirects(0)
    response.assertFlashMessage(
      'success',
      'Les informations de « Millennium Falcon™ » sont enregistrées.'
    )
    const entry = await UserSet.query().where({ userId: user.id, setId: id }).firstOrFail()
    assert.deepInclude(entry.serialize(), {
      quantity: 2,
      condition: 'sealed',
      purchasePrice: 799.5,
      note: 'Cadeau',
    })
    assert.equal(entry.purchaseDate?.toISODate(), '2023-11-24')

    const page = await client.get('/sets/75192-1-millennium-falcon').loginAs(user).withInertia()
    assert.deepInclude(page.inertiaProps.ownedEntry, { quantity: 2, purchaseDate: '2023-11-24' })
  })

  test('the details are validated', async ({ client, assert }) => {
    const user = await createUser()
    const id = await setId('75192-1')
    await UserSet.create({ userId: user.id, setId: id, status: 'owned' })

    const response = await client
      .put(`/collection/sets/${id}/details`)
      .loginAs(user)
      .form({ quantity: '0', condition: 'broken', purchasePrice: '-3', purchaseDate: '2999-01-01' })
      .withCsrfToken()
      .redirects(0)
    const errors = formErrors(response)
    assert.match(firstError(errors.quantity)!, /entre 1 et 999/)
    assert.equal(firstError(errors.condition), 'Choisis une valeur dans la liste.')
    assert.match(firstError(errors.purchasePrice)!, /entre 0 et 100000/)
    assert.equal(firstError(errors.purchaseDate), 'La date ne peut pas être dans le futur.')
  })

  test('details of a set that is not owned return 404', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .put(`/collection/sets/${await setId('75192-1')}/details`)
      .loginAs(user)
      .form({ quantity: '2' })
      .withCsrfToken()
    response.assertStatus(404)
  })
})

test.group('Collection: privacy between users', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('a user cannot see the collection of another user', async ({ client, assert }) => {
    const alice = await createUser({ email: 'alice@example.com', username: 'alice' })
    const bob = await createUser({ email: 'bob@example.com', username: 'bob' })
    await UserSet.create({ userId: alice.id, setId: await setId('75192-1'), status: 'owned' })

    const bobPage = await client.get('/ma-collection').loginAs(bob).withInertia()
    assert.lengthOf(bobPage.inertiaProps.sets, 0)
    assert.equal(bobPage.inertiaProps.counts.sets, 0)

    const alicePage = await client.get('/ma-collection').loginAs(alice).withInertia()
    assert.deepEqual(
      alicePage.inertiaProps.sets.map((set: { setNum: string }) => set.setNum),
      ['75192-1']
    )
  })

  test('a user cannot change the collection of another user', async ({ client, assert }) => {
    const alice = await createUser({ email: 'alice@example.com', username: 'alice' })
    const bob = await createUser({ email: 'bob@example.com', username: 'bob' })
    const id = await setId('75192-1')
    await UserSet.create({ userId: alice.id, setId: id, status: 'owned', quantity: 3 })

    // Bob "removes" the set: only his own (empty) entry is concerned
    await client
      .post(`/collection/sets/${id}/owned`)
      .loginAs(bob)
      .form({ action: 'remove' })
      .withCsrfToken()
    // Bob edits the details: he does not own it
    const details = await client
      .put(`/collection/sets/${id}/details`)
      .loginAs(bob)
      .form({ quantity: '1' })
      .withCsrfToken()
    details.assertStatus(404)

    const aliceEntry = await UserSet.query().where({ userId: alice.id, setId: id }).firstOrFail()
    assert.equal(aliceEntry.quantity, 3)
  })
})

test.group('Wishlist: total and sharing', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('shows the estimated price of the wishlist', async ({ client, assert }) => {
    const user = await createUser()
    // 75192-1: 849.99 €, 8880-1: 199.99 € ×2, 75192-2: no price
    await UserSet.create({ userId: user.id, setId: await setId('75192-1'), status: 'wanted' })
    await UserSet.create({
      userId: user.id,
      setId: await setId('8880-1'),
      status: 'wanted',
      quantity: 2,
    })
    await UserSet.create({ userId: user.id, setId: await setId('75192-2'), status: 'wanted' })

    const response = await client.get('/ma-wishlist').loginAs(user).withInertia()
    assert.deepEqual(response.inertiaProps.wishlistTotal, { total: 1249.97, unknownPrices: 1 })
  })

  test('a shared wishlist is public, read-only and shows only the wishlist', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await UserSet.create({ userId: user.id, setId: await setId('75192-1'), status: 'wanted' })
    await UserSet.create({ userId: user.id, setId: await setId('8880-1'), status: 'owned' })
    await UserMinifig.create({
      userId: user.id,
      minifigId: await minifigId('fig-000001'),
      status: 'owned',
    })

    await client.post('/ma-wishlist/partage').loginAs(user).withCsrfToken()
    await user.refresh()
    assert.lengthOf(user.wishlistShareToken!, 32)

    const shared = await client.get(`/wishlist/${user.wishlistShareToken}`).withInertia()
    shared.assertStatus(200)
    assert.equal(shared.inertiaProps.mode, 'shared')
    assert.deepEqual(shared.inertiaProps.owner, { username: 'fan' })
    assert.deepEqual(
      shared.inertiaProps.sets.map((set: { setNum: string }) => set.setNum),
      ['75192-1']
    )
    assert.deepInclude(shared.inertiaProps.counts, { sets: 1, minifigs: 0 })
    // no email or private data
    assert.notInclude(JSON.stringify(shared.inertiaProps), 'fan@example.com')

    const minifigsTab = await client
      .get(`/wishlist/${user.wishlistShareToken}`)
      .qs({ tab: 'minifigs' })
      .withInertia()
    assert.lengthOf(minifigsTab.inertiaProps.minifigs, 0)
  })

  test('turning sharing off breaks the link; unknown links return 404', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await client.post('/ma-wishlist/partage').loginAs(user).withCsrfToken()
    await user.refresh()
    const token = user.wishlistShareToken!

    const off = await client
      .post('/ma-wishlist/partage/desactiver')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    off.assertFlashMessage('success', 'Partage désactivé.')
    await user.refresh()
    assert.isNull(user.wishlistShareToken)

    const old = await client.get(`/wishlist/${token}`)
    old.assertStatus(404)
    const random = await client.get('/wishlist/not-a-token')
    random.assertStatus(404)
  })
})

test.group('Collection pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('filters the collection like the catalogue, plus the condition', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await UserSet.create({
      userId: user.id,
      setId: await setId('75192-1'),
      status: 'owned',
      condition: 'sealed',
    })
    await UserSet.create({
      userId: user.id,
      setId: await setId('8880-1'),
      status: 'owned',
      condition: 'built',
    })
    await UserSet.create({ userId: user.id, setId: await setId('0003977811-1'), status: 'owned' })

    const all = await client.get('/ma-collection').loginAs(user).withInertia()
    // books count too in a collection
    assert.equal(all.inertiaProps.pagination.total, 3)

    const sealed = await client
      .get('/ma-collection')
      .qs({ condition: 'sealed' })
      .loginAs(user)
      .withInertia()
    assert.deepEqual(
      sealed.inertiaProps.sets.map((set: { setNum: string }) => set.setNum),
      ['75192-1']
    )
    assert.deepEqual(sealed.inertiaProps.entries[await setId('75192-1')], {
      quantity: 1,
      condition: 'sealed',
    })

    const technic = await client
      .get('/ma-collection')
      .qs({ theme: 'technic' })
      .loginAs(user)
      .withInertia()
    assert.deepEqual(
      technic.inertiaProps.sets.map((set: { setNum: string }) => set.setNum),
      ['8880-1']
    )
  })

  test('the minifigs tab lists the owned minifigs', async ({ client, assert }) => {
    const user = await createUser()
    await UserMinifig.create({
      userId: user.id,
      minifigId: await minifigId('fig-000003'),
      status: 'owned',
      quantity: 2,
    })

    const response = await client
      .get('/ma-collection')
      .qs({ tab: 'minifigs' })
      .loginAs(user)
      .withInertia()
    assert.equal(response.inertiaProps.tab, 'minifigs')
    assert.deepEqual(
      response.inertiaProps.minifigs.map((minifig: { figNum: string }) => minifig.figNum),
      ['fig-000003']
    )
    assert.deepInclude(response.inertiaProps.counts, { minifigs: 1, minifigCopies: 2 })
  })

  test('the preference to add minifigs is saved from the account page', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await client
      .put('/mon-compte/preferences')
      .loginAs(user)
      .form({ autoAddMinifigs: 'true' })
      .withCsrfToken()
    await user.refresh()
    assert.isTrue(user.autoAddMinifigs)

    await client.put('/mon-compte/preferences').loginAs(user).form({}).withCsrfToken()
    await user.refresh()
    assert.isFalse(user.autoAddMinifigs)
  })
})
