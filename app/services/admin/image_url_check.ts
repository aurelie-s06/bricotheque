/**
 * Checks a picture URL pasted in the back office: https only, a public host
 * name, and the server must answer with an image.
 */
export type ImageCheck =
  { ok: true } | { ok: false; reason: 'https' | 'host' | 'unreachable' | 'notImage' }

const PRIVATE_HOST = /^(localhost|.*\.local|\d{1,3}(\.\d{1,3}){3}|\[.*\])$/i

export default class ImageUrlCheck {
  /** Replaced in the tests */
  static fetcher: typeof fetch = (input, init) => fetch(input, init)

  static async check(value: string): Promise<ImageCheck> {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      return { ok: false, reason: 'https' }
    }
    if (url.protocol !== 'https:') return { ok: false, reason: 'https' }
    if (PRIVATE_HOST.test(url.hostname)) return { ok: false, reason: 'host' }

    for (const method of ['HEAD', 'GET']) {
      try {
        const response = await this.fetcher(url, {
          method,
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
        })
        const type = response.headers.get('content-type') ?? ''
        if (response.ok && type.startsWith('image/')) return { ok: true }
        if (response.ok && method === 'GET') return { ok: false, reason: 'notImage' }
      } catch {
        // try GET after a failed HEAD (some servers refuse HEAD)
      }
    }
    return { ok: false, reason: 'unreachable' }
  }
}
