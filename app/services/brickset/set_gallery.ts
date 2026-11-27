import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import BricksetClient from '#services/brickset/brickset_client'
import type { BricksetApi, BricksetImage } from '#services/brickset/types'
import { nowForSql } from '#services/rebrickable/bulk'

/** getAdditionalImages calls per day, kept out of the nightly Brickset import */
export const DEFAULT_DAILY_LIMIT = 20

/** Pictures of a set are fetched again after this many days */
export const REFRESH_DAYS = 90

/** After an error (quota reached, Brickset down), no call for this long */
const PAUSE_AFTER_ERROR_MS = 60 * 60 * 1000

/** At night, part of the daily budget goes to the most collected sets */
export const NIGHTLY_SHARE = 0.5

export type GalleryImage = { url: string; thumbnailUrl: string | null }

type GallerySet = {
  id: number
  bricksetId: number | null
  additionalImageCount: number | null
  additionalImagesFetchedAt: DateTime | null
}

/** Only web addresses, in https (Brickset serves both) */
function cleanUrl(value: string | undefined) {
  if (!value || !/^https?:\/\//i.test(value)) return null
  return value.replace(/^http:\/\//i, 'https://')
}

/**
 * Additional pictures of the sets, from Brickset. Each set costs one call
 * of the daily quota, so they are fetched one set at a time: when someone
 * opens the page of a set, and at night for the most collected sets, at
 * most BRICKSET_IMAGES_DAILY_LIMIT sets a day. Sets that Brickset announces
 * without additional pictures never cost a call.
 */
export default class SetGallery {
  /** Lets the tests inject a fake API */
  static apiFactory: (() => BricksetApi) | undefined

  static #pausedUntil = 0

  static dailyLimit(): number {
    return env.get('BRICKSET_IMAGES_DAILY_LIMIT') ?? DEFAULT_DAILY_LIMIT
  }

  /** Forgets a pause after an error (tests) */
  static resetPause() {
    this.#pausedUntil = 0
  }

  static needsFetch(set: GallerySet): boolean {
    if (!set.bricksetId || !set.additionalImageCount) return false
    if (!set.additionalImagesFetchedAt) return true
    return set.additionalImagesFetchedAt < DateTime.utc().minus({ days: REFRESH_DAYS })
  }

  /** Sets whose pictures were fetched today (UTC, like the Brickset quota) */
  static async fetchedToday(): Promise<number> {
    const start = DateTime.utc().startOf('day').toSQL({ includeOffset: false })
    const row = await db
      .from('sets')
      .where('additional_images_fetched_at', '>=', start)
      .count('* as total')
      .first()
    return Number(row?.total ?? 0)
  }

  static async imagesOf(setId: number): Promise<GalleryImage[]> {
    const rows: { image_url: string; thumbnail_url: string | null }[] = await db
      .from('set_images')
      .where('set_id', setId)
      .orderBy('position')
      .select('image_url', 'thumbnail_url')
    return rows.map((row) => ({ url: row.image_url, thumbnailUrl: row.thumbnail_url }))
  }

  /**
   * Page of a set: fetches its pictures when they are missing or old and
   * the budget of the day allows it. Never throws: the page shows without
   * the pictures, which come at a later visit.
   */
  static async ensure(set: GallerySet): Promise<void> {
    if (!this.needsFetch(set) || Date.now() < this.#pausedUntil) return
    try {
      if ((await this.fetchedToday()) >= this.dailyLimit()) return
      await this.fetch(set.id, set.bricksetId!, this.#api())
    } catch (error) {
      this.#pause(error)
    }
  }

  /**
   * Nightly batch: the sets most present in collections and wishlists,
   * then the most recent, with part of the budget of the day.
   */
  static async prefetch(onWarning: (message: string) => void = () => {}) {
    const budget = Math.floor(this.dailyLimit() * NIGHTLY_SHARE) - (await this.fetchedToday())
    if (budget <= 0) return 0

    const refreshBefore = DateTime.utc().minus({ days: REFRESH_DAYS }).toSQL({
      includeOffset: false,
    })
    const sets: { id: number; brickset_id: number }[] = await db
      .from('sets')
      .whereNotNull('brickset_id')
      .where('additional_image_count', '>', 0)
      .where((query) =>
        query
          .whereNull('additional_images_fetched_at')
          .orWhere('additional_images_fetched_at', '<', refreshBefore)
      )
      .select('id', 'brickset_id')
      .select(
        db.raw('(SELECT COUNT(*) FROM user_sets WHERE user_sets.set_id = sets.id) as collected')
      )
      .orderBy('collected', 'desc')
      .orderBy('year', 'desc')
      .orderBy('id', 'desc')
      .limit(budget)
    if (sets.length === 0) return 0

    const api = this.#api()
    let fetched = 0
    for (const set of sets) {
      try {
        await this.fetch(set.id, set.brickset_id, api)
        fetched++
      } catch (error) {
        // Quota reached or Brickset down: the next ones would fail too
        onWarning(`Photos du set ${set.id} : ${(error as Error).message}`)
        break
      }
    }
    return fetched
  }

  /** One call: replaces the stored pictures of the set */
  static async fetch(setId: number, bricksetId: number, api: BricksetApi) {
    const images = await api.getAdditionalImages(bricksetId)
    const rows = this.#rows(setId, images)
    const now = nowForSql()

    await db.transaction(async (trx) => {
      await trx.from('set_images').where('set_id', setId).delete()
      if (rows.length) {
        await trx.table('set_images').multiInsert(rows.map((row) => ({ ...row, created_at: now })))
      }
      await trx.from('sets').where('id', setId).update({ additional_images_fetched_at: now })
    })
    return rows.length
  }

  static #rows(setId: number, images: BricksetImage[]) {
    const seen = new Set<string>()
    const rows = []
    for (const image of images) {
      const url = cleanUrl(image.imageURL)
      if (!url || seen.has(url)) continue
      seen.add(url)
      rows.push({
        set_id: setId,
        position: rows.length + 1,
        image_url: url.slice(0, 512),
        thumbnail_url: cleanUrl(image.thumbnailURL)?.slice(0, 512) ?? null,
      })
    }
    return rows
  }

  static #api(): BricksetApi {
    return this.apiFactory?.() ?? new BricksetClient(env.get('BRICKSET_API_KEY')?.release() ?? '')
  }

  static #pause(error: unknown) {
    this.#pausedUntil = Date.now() + PAUSE_AFTER_ERROR_MS
    logger.warn(`Photos Brickset en pause pour une heure : ${(error as Error).message}`)
  }
}
