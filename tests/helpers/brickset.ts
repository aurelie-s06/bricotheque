import type {
  BricksetApi,
  BricksetImage,
  BricksetSet,
  GetSetsParams,
  GetSetsResponse,
} from '#services/brickset/types'

/**
 * In-memory Brickset API: answers getSets by set number or by year with
 * pagination, and counts the calls like the real quota.
 */
export class FakeBricksetApi implements BricksetApi {
  calls: GetSetsParams[] = []
  /** Pictures returned by getAdditionalImages, by Brickset setID */
  images = new Map<number, BricksetImage[]>()
  imageCalls: number[] = []
  /** Makes getAdditionalImages fail (quota, network) */
  imagesError: Error | null = null

  constructor(
    public sets: BricksetSet[],
    public callsToday = 0,
    public validKey = true
  ) {}

  async checkKey() {
    return this.validKey
  }

  async getSetsCallsToday() {
    return this.callsToday
  }

  async getAdditionalImages(setId: number) {
    this.imageCalls.push(setId)
    this.callsToday++
    if (this.imagesError) throw this.imagesError
    return this.images.get(setId) ?? []
  }

  async getSets(params: GetSetsParams): Promise<GetSetsResponse> {
    this.calls.push(params)
    this.callsToday++

    if (params.setNumber) {
      const sets = this.sets.filter(
        (set) => `${set.number}-${set.numberVariant}` === params.setNumber
      )
      return { matches: sets.length, sets }
    }

    const matching = this.sets.filter((set) => String(set.year) === params.year)
    const size = params.pageSize ?? 20
    const page = params.pageNumber ?? 1
    return { matches: matching.length, sets: matching.slice((page - 1) * size, page * size) }
  }
}

export function bricksetSet(overrides: Partial<BricksetSet> & { number: string; year: number }) {
  return {
    setID: Math.floor(Math.random() * 1_000_000) + 1,
    numberVariant: 1,
    name: `Set ${overrides.number}`,
    ...overrides,
  } satisfies BricksetSet
}

/**
 * Brickset data for the sets of tests/fixtures/rebrickable/initial,
 * plus a set that is not in our catalogue.
 */
export function bricksetFixtures(): BricksetSet[] {
  return [
    bricksetSet({
      setID: 26725,
      number: '75192',
      year: 2017,
      subtheme: 'Ultimate Collector Series',
      launchDate: '2017-10-01T00:00:00Z',
      exitDate: '2026-12-31T00:00:00Z',
      LEGOCom: {
        US: { retailPrice: 849.99 },
        UK: { retailPrice: 734.99 },
        DE: { retailPrice: 849.99, dateFirstAvailable: '2018-04-09T00:00:00Z' },
      },
      extendedData: {
        description:
          '<p>Welcome to the largest LEGO&reg; <i>Star Wars</i> Millennium Falcon we&rsquo;ve ever created.</p><p>Includes 7 minifigures.</p>',
      },
    }),
    bricksetSet({ setID: 1001, number: '99999', year: 2017 }), // not in our catalogue
    bricksetSet({ setID: 8880, number: '8880', year: 1994, subtheme: '{None}' }),
    bricksetSet({
      setID: 31000,
      number: '0003977811',
      year: 2022,
      launchDate: '2022-03-01T00:00:00Z',
      exitDate: '2023-12-31T00:00:00Z',
    }),
  ]
}
