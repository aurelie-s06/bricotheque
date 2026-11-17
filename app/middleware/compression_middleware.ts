import compression from 'compression'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Gzip / Brotli compression of the responses for the clients that accept it
 * (Opquast rule 226). The Express-style middleware patches the Node
 * response before AdonisJS writes to it.
 */
const compress = compression({ threshold: 1024 })

export default class CompressionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    await new Promise<void>((resolve, reject) =>
      compress(request.request as never, response.response as never, (error?: unknown) =>
        error ? reject(error) : resolve()
      )
    )
    return next()
  }
}
