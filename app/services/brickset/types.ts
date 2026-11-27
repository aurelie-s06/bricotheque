/**
 * Subset of the Brickset API v3 `getSets` response that we use.
 * Checked against real responses on 2026-11-16.
 * https://brickset.com/article/52664/api-version-3-documentation
 */
export type BricksetCountryPrice = {
  retailPrice?: number
  dateFirstAvailable?: string
  dateLastAvailable?: string
}

export type BricksetSet = {
  setID: number
  number: string
  numberVariant: number
  name: string
  year: number
  theme?: string
  subtheme?: string
  category?: string
  released?: boolean
  pieces?: number
  minifigs?: number
  launchDate?: string
  exitDate?: string
  availability?: string
  LEGOCom?: {
    US?: BricksetCountryPrice
    UK?: BricksetCountryPrice
    CA?: BricksetCountryPrice
    DE?: BricksetCountryPrice
  }
  extendedData?: { description?: string; tags?: string[] }
  /** Pictures available with getAdditionalImages (0 when none) */
  additionalImageCount?: number
  lastUpdated?: string
}

/** One entry of getAdditionalImages */
export type BricksetImage = { thumbnailURL?: string; imageURL?: string }

export type GetSetsParams = {
  setNumber?: string
  year?: string
  theme?: string
  pageSize?: number
  pageNumber?: number
  extendedData?: 1
  orderBy?: string
}

export type GetSetsResponse = { matches: number; sets: BricksetSet[] }

export type KeyUsage = { dateStamp: string; count: number }

/**
 * What the importer needs from Brickset; implemented by BricksetClient
 * and by a fake in the tests.
 */
export interface BricksetApi {
  checkKey(): Promise<boolean>
  /** API calls made today (UTC) with this key (every method counts since 2026-11-19) */
  getSetsCallsToday(): Promise<number>
  getSets(params: GetSetsParams): Promise<GetSetsResponse>
  /** Additional pictures of a set (Brickset setID); one call of the quota */
  getAdditionalImages(setId: number): Promise<BricksetImage[]>
}
