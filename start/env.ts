/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Legal notice and contact (public pages); left empty, the pages say "to be completed"
  LEGAL_PUBLISHER: Env.schema.string.optional(),
  CONTACT_EMAIL: Env.schema.string.optional({ format: 'email' }),
  CONTACT_ISSUES_URL: Env.schema.string.optional({ format: 'url' }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database (MySQL)
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.secret.optional(),
  DB_DATABASE: Env.schema.string(),

  // Rate limiting
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  // Brickset API v3 (https://brickset.com/tools/webservices/requestkey/)
  BRICKSET_API_KEY: Env.schema.secret.optional(),
  // Max calls per day allowed by Brickset, all methods (the importer keeps a small margin)
  BRICKSET_DAILY_LIMIT: Env.schema.number.optional(),
  // Calls of that quota kept for the additional pictures of the sets (default 20)
  BRICKSET_IMAGES_DAILY_LIMIT: Env.schema.number.optional(),

  // Claude API (Anthropic): French translation of the Brickset descriptions
  ANTHROPIC_API_KEY: Env.schema.secret.optional(),

  // BrickLink API (OAuth 1.0, optional)
  BRICKLINK_CONSUMER_KEY: Env.schema.string.optional(),
  BRICKLINK_CONSUMER_SECRET: Env.schema.secret.optional(),
  BRICKLINK_TOKEN_VALUE: Env.schema.string.optional(),
  BRICKLINK_TOKEN_SECRET: Env.schema.secret.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */

  // Mail: "log" writes the emails to tmp/mails (development), "smtp" sends them
  MAIL_MAILER: Env.schema.enum(['log', 'smtp'] as const),
  MAIL_FROM_NAME: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: 'email' }),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.secret.optional(),
})
