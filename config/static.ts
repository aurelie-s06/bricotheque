import { defineConfig } from '@adonisjs/static'

/**
 * Configuration options to tweak the static files middleware.
 * The complete set of options are documented on the
 * official documentation website.
 *
 * https://docs.adonisjs.com/guides/basics/static-file-server
 */
const staticServerConfig = defineConfig({
  /**
   * Enable or disable static file serving middleware.
   */
  enabled: true,

  /**
   * Generate ETag headers for client/proxy caching.
   */
  etag: true,

  /**
   * Include Last-Modified headers for conditional requests.
   */
  lastModified: true,

  /**
   * Policy for files starting with a dot.
   */
  dotFiles: 'ignore',

  /**
   * Cache: built assets have a hash in their name and never change; the
   * other files (favicons, robots.txt…) are kept one day.
   */
  maxAge: '1d',
  headers: (path) =>
    path.includes('/assets/') ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {},
})

export default staticServerConfig
