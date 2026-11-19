import type { HttpContext } from '@adonisjs/core/http'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import Collection, { type CollectionKind, type CollectionStatus } from '#services/collection'
import {
  minifigDetailsValidator,
  quickAddValidator,
  setDetailsValidator,
} from '#validators/collection'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { Exception } from '@adonisjs/core/exceptions'

async function itemName(kind: CollectionKind, id: number) {
  const item = kind === 'sets' ? await BrickSet.find(id) : await Minifig.find(id)
  if (!item) {
    throw new Exception('Introuvable', { status: 404, code: 'E_ITEM_NOT_FOUND' })
  }
  return item.name
}

/**
 * Buttons "Je l'ai" / "Je le veux" / "Je l'ai eu !" and the collection
 * details. Every action works on the logged-in user's own entries.
 * Each action is a plain POST form (works without JavaScript) that goes
 * back to the page.
 */
export default class CollectionActionsController {
  /** POST /collection/:kind/:id/:status  (action=add|remove) */
  async toggle({ params, request, auth, session, response }: HttpContext) {
    const kind = params.kind as CollectionKind
    const status = params.status as CollectionStatus
    const id = Number(params.id)
    const locale = resolveLocale(request)
    const name = await itemName(kind, id)
    const collection = new Collection(auth.getUserOrFail())

    if (request.input('action') === 'remove') {
      await collection.remove(kind, id, status)
      session.flash(
        'success',
        serverMessage(
          locale,
          status === 'owned' ? 'collection.removedOwned' : 'collection.removedWanted',
          { name }
        )
      )
    } else {
      const minifigs = await collection.add(kind, id, status)
      const key =
        status === 'wanted'
          ? 'collection.addedWanted'
          : minifigs > 0
            ? 'collection.addedOwnedWithMinifigs'
            : 'collection.addedOwned'
      session.flash('success', serverMessage(locale, key, { name, count: minifigs }))
    }
    return response.redirect().back()
  }

  /**
   * POST /collection/ajout-rapide: adds the sets typed by number to the
   * collection (status=owned) or the wishlist (status=wanted)
   */
  async quickAdd({ request, auth, session, response }: HttpContext) {
    const { numbers, status } = await request.validateUsing(quickAddValidator, {
      messagesProvider: validationMessages(resolveLocale(request)),
    })
    const result = await new Collection(auth.getUserOrFail()).quickAdd(numbers, status)
    session.flash('quickAdd', { ...result, status })
    return response.redirect().back()
  }

  /** POST /collection/:kind/:id/acquired: "Je l'ai eu !" */
  async acquire({ params, request, auth, session, response }: HttpContext) {
    const kind = params.kind as CollectionKind
    const id = Number(params.id)
    const name = await itemName(kind, id)
    await new Collection(auth.getUserOrFail()).acquire(kind, id)
    session.flash('success', serverMessage(resolveLocale(request), 'collection.acquired', { name }))
    return response.redirect().back()
  }

  /** POST /collection/sets/:id/minifigs: add the minifigs of an owned set */
  async addSetMinifigs({ params, request, auth, session, response }: HttpContext) {
    const count = await new Collection(auth.getUserOrFail()).addMinifigsOfSet(Number(params.id))
    session.flash(
      'success',
      serverMessage(resolveLocale(request), 'collection.minifigsAdded', { count })
    )
    return response.redirect().back()
  }

  /** PUT /collection/sets/:id/details: quantity and condition */
  async updateSetDetails({ params, request, auth, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const entry = await new Collection(auth.getUserOrFail()).ownedSet(Number(params.id))
    if (!entry) {
      throw new Exception('Set absent de la collection', { status: 404, code: 'E_NOT_OWNED' })
    }
    const data = await request.validateUsing(setDetailsValidator, {
      messagesProvider: validationMessages(locale),
    })
    entry.merge({ quantity: data.quantity, condition: data.condition ?? null })
    await entry.save()
    const name = await itemName('sets', entry.setId)
    session.flash('success', serverMessage(locale, 'collection.detailsSaved', { name }))
    return response.redirect().back()
  }

  /** PUT /collection/minifigs/:id/details: quantity */
  async updateMinifigDetails({ params, request, auth, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const entry = await new Collection(auth.getUserOrFail()).ownedMinifig(Number(params.id))
    if (!entry) {
      throw new Exception('Minifig absente de la collection', { status: 404, code: 'E_NOT_OWNED' })
    }
    const data = await request.validateUsing(minifigDetailsValidator, {
      messagesProvider: validationMessages(locale),
    })
    entry.merge({ quantity: data.quantity })
    await entry.save()
    const name = await itemName('minifigs', entry.minifigId)
    session.flash('success', serverMessage(locale, 'collection.detailsSaved', { name }))
    return response.redirect().back()
  }
}
