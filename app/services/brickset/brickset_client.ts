import type {
  BricksetApi,
  GetSetsParams,
  GetSetsResponse,
  KeyUsage,
} from '#services/brickset/types'

export const BRICKSET_API_URL = 'https://brickset.com/api/v3.asmx'

export class BricksetError extends Error {}

type Fetch = typeof fetch

/**
 * Minimal client for the Brickset API v3. Every method is a POST of
 * form-encoded parameters; the response is JSON with a `status` field.
 */
export default class BricksetClient implements BricksetApi {
  #apiKey: string
  #fetch: Fetch

  constructor(apiKey: string, options: { fetch?: Fetch } = {}) {
    if (!apiKey) {
      throw new BricksetError('BRICKSET_API_KEY manquante dans .env')
    }
    this.#apiKey = apiKey
    this.#fetch = options.fetch ?? fetch
  }

  async checkKey() {
    try {
      await this.#call('checkKey')
      return true
    } catch (error) {
      if (error instanceof BricksetError) {
        return false
      }
      throw error
    }
  }

  async getSetsCallsToday() {
    const body = await this.#call<{ apiKeyUsage: KeyUsage[] }>('getKeyUsageStats')
    const today = new Date().toISOString().slice(0, 10)
    const entry = body.apiKeyUsage.find((usage) => usage.dateStamp.startsWith(today))
    return entry?.count ?? 0
  }

  async getSets(params: GetSetsParams): Promise<GetSetsResponse> {
    const body = await this.#call<GetSetsResponse>('getSets', {
      userHash: '',
      params: JSON.stringify(params),
    })
    return { matches: body.matches, sets: body.sets ?? [] }
  }

  async #call<T>(method: string, fields: Record<string, string> = {}): Promise<T> {
    const response = await this.#fetch(`${BRICKSET_API_URL}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Briquotheque-importer',
      },
      body: new URLSearchParams({ apiKey: this.#apiKey, ...fields }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) {
      throw new BricksetError(`Brickset ${method} : HTTP ${response.status}`)
    }

    const body = (await response.json()) as { status: string; message?: string } & T
    if (body.status !== 'success') {
      throw new BricksetError(`Brickset ${method} : ${body.message ?? body.status}`)
    }
    return body
  }
}
