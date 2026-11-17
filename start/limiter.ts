/*
|--------------------------------------------------------------------------
| HTTP limiters
|--------------------------------------------------------------------------
|
| Rate limits of the account forms, per IP address. Failed logins are
| limited in SessionController (only failures count there).
|
*/

import limiter from '@adonisjs/limiter/services/main'

/** 5 account creations per hour */
export const signupThrottle = limiter.define('signup', (ctx) => {
  return limiter.allowRequests(5).every('1 hour').usingKey(`signup_${ctx.request.ip()}`)
})

/** 5 "forgot password" emails per 15 minutes */
export const forgotPasswordThrottle = limiter.define('forgot_password', (ctx) => {
  return limiter.allowRequests(5).every('15 mins').usingKey(`forgot_password_${ctx.request.ip()}`)
})
