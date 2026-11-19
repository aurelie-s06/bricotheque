import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import type User from '#models/user'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'

export type CollectionKind = 'sets' | 'minifigs'
export type CollectionStatus = 'owned' | 'wanted'

export const COLLECTION_KINDS = ['sets', 'minifigs'] as const
export const COLLECTION_STATUSES = ['owned', 'wanted'] as const

export type CollectionIds = {
  ownedSets: number[]
  wantedSets: number[]
  ownedMinifigs: number[]
  wantedMinifigs: number[]
}

/** At most this many numbers in one quick add */
export const QUICK_ADD_MAX = 300

/**
 * Set numbers typed by hand ("75192, 10294-1 42115"): separated by commas,
 * spaces, semicolons or new lines. "75192" means version 1 ("75192-1").
 */
export function parseSetNumbers(text: string) {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(tokens)].slice(0, QUICK_ADD_MAX).map((typed) => ({
    typed,
    setNum: /-\d+$/.test(typed) ? typed : `${typed}-1`,
  }))
}

const notFound = (kind: CollectionKind, id: number) =>
  new Exception(`${kind} ${id} introuvable`, { status: 404, code: 'E_ITEM_NOT_FOUND' })

/**
 * A user's collection (status "owned") and wishlist (status "wanted").
 * Every method works on the given user only: there is no way to reach
 * another user's entries.
 */
export default class Collection {
  constructor(private user: User) {}

  /** Ids in the collection and the wishlist, for the buttons of every page */
  async ids(): Promise<CollectionIds> {
    const [sets, minifigs] = await Promise.all([
      db.from('user_sets').where('user_id', this.user.id).select('set_id', 'status'),
      db.from('user_minifigs').where('user_id', this.user.id).select('minifig_id', 'status'),
    ])
    const pick = (rows: Record<string, any>[], column: string, status: CollectionStatus) =>
      rows.filter((row) => row.status === status).map((row) => Number(row[column]))
    return {
      ownedSets: pick(sets, 'set_id', 'owned'),
      wantedSets: pick(sets, 'set_id', 'wanted'),
      ownedMinifigs: pick(minifigs, 'minifig_id', 'owned'),
      wantedMinifigs: pick(minifigs, 'minifig_id', 'wanted'),
    }
  }

  /**
   * Adds an item. Adding a set to the collection also adds its minifigs
   * when the user chose so. Returns the number of minifigs added that way.
   */
  async add(kind: CollectionKind, id: number, status: CollectionStatus) {
    await this.#assertExists(kind, id)
    if (kind === 'sets') {
      await UserSet.firstOrCreate({ userId: this.user.id, setId: id, status }, { quantity: 1 })
      if (status === 'owned' && this.user.autoAddMinifigs) {
        return this.addMinifigsOfSet(id)
      }
    } else {
      await UserMinifig.firstOrCreate(
        { userId: this.user.id, minifigId: id, status },
        { quantity: 1 }
      )
    }
    return 0
  }

  async remove(kind: CollectionKind, id: number, status: CollectionStatus) {
    if (kind === 'sets') {
      await UserSet.query().where({ userId: this.user.id, setId: id, status }).delete()
    } else {
      await UserMinifig.query().where({ userId: this.user.id, minifigId: id, status }).delete()
    }
  }

  /** "Je l'ai eu !": from the wishlist to the collection */
  async acquire(kind: CollectionKind, id: number) {
    await this.remove(kind, id, 'wanted')
    return this.add(kind, id, 'owned')
  }

  /**
   * Makes sure every minifig of the set is in the collection (with at
   * least the quantity found in the set). Returns how many were added.
   */
  async addMinifigsOfSet(setId: number) {
    const links: { minifig_id: number; quantity: number }[] = await db
      .from('set_minifigs')
      .where('set_id', setId)
      .select('minifig_id', 'quantity')
    let added = 0
    for (const link of links) {
      const entry = await UserMinifig.firstOrNew(
        { userId: this.user.id, minifigId: link.minifig_id, status: 'owned' },
        { quantity: link.quantity }
      )
      if (!entry.$isPersisted) {
        await entry.save()
        added++
      }
    }
    return added
  }

  /**
   * Minifigs of the sets already in the collection that are not in it yet,
   * with the largest quantity found in one of these sets.
   */
  async missingMinifigsOfOwnedSets(): Promise<{ minifig_id: number; quantity: number }[]> {
    return db
      .from('set_minifigs')
      .join('user_sets', 'user_sets.set_id', 'set_minifigs.set_id')
      .where('user_sets.user_id', this.user.id)
      .where('user_sets.status', 'owned')
      .whereNotIn(
        'set_minifigs.minifig_id',
        db
          .from('user_minifigs')
          .where('user_id', this.user.id)
          .where('status', 'owned')
          .select('minifig_id')
      )
      .groupBy('set_minifigs.minifig_id')
      .select('set_minifigs.minifig_id')
      .max('set_minifigs.quantity as quantity')
  }

  async countMissingMinifigsOfOwnedSets() {
    const missing = await this.missingMinifigsOfOwnedSets()
    return missing.length
  }

  /**
   * For members who forgot the "add the minifigs" option: adds the minifigs
   * of every set already in the collection. Returns how many were added.
   */
  async addMinifigsOfOwnedSets() {
    const missing = await this.missingMinifigsOfOwnedSets()
    if (missing.length === 0) return 0
    const now = new Date()
    for (let index = 0; index < missing.length; index += 500) {
      await db.table('user_minifigs').insert(
        missing.slice(index, index + 500).map((row) => ({
          user_id: this.user.id,
          minifig_id: row.minifig_id,
          status: 'owned',
          quantity: Number(row.quantity) || 1,
          created_at: now,
          updated_at: now,
        }))
      )
    }
    return missing.length
  }

  /**
   * Adds many sets typed by number. Returns what was added, what was
   * already there, the numbers not found and the minifigs added with them.
   */
  async quickAdd(text: string, status: CollectionStatus) {
    const numbers = parseSetNumbers(text)
    const sets: { id: number; set_num: string }[] = numbers.length
      ? await db
          .from('sets')
          .whereIn(
            'set_num',
            numbers.map((number) => number.setNum)
          )
          .select('id', 'set_num')
      : []
    const byNum = new Map(sets.map((set) => [set.set_num.toLowerCase(), Number(set.id)]))
    const ids = await this.ids()
    const already = new Set(status === 'owned' ? ids.ownedSets : ids.wantedSets)

    const result = { added: 0, alreadyThere: 0, minifigs: 0, unknown: [] as string[] }
    for (const number of numbers) {
      const id = byNum.get(number.setNum)
      if (id === undefined) {
        result.unknown.push(number.typed)
      } else if (already.has(id)) {
        result.alreadyThere++
      } else {
        result.minifigs += await this.add('sets', id, status)
        already.add(id)
        result.added++
      }
    }
    return result
  }

  /** The collection entry of a set or a minifig, or null */
  ownedSet(setId: number) {
    return UserSet.query().where({ userId: this.user.id, setId, status: 'owned' }).first()
  }

  ownedMinifig(minifigId: number) {
    return UserMinifig.query().where({ userId: this.user.id, minifigId, status: 'owned' }).first()
  }

  async #assertExists(kind: CollectionKind, id: number) {
    const item = kind === 'sets' ? await BrickSet.find(id) : await Minifig.find(id)
    if (!item) throw notFound(kind, id)
  }
}
