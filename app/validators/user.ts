import vine from '@vinejs/vine'

/**
 * Shared rules. Emails are stored in lower case so that logging in does
 * not depend on the case typed.
 */
const email = () => vine.string().trim().email().maxLength(254).toLowerCase()
export const PASSWORD_MIN_LENGTH = 10
const newPassword = () => vine.string().minLength(PASSWORD_MIN_LENGTH).maxLength(128)
const username = () =>
  vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(30)
    .regex(/^[a-zA-Z0-9_.-]+$/)

export const signupValidator = vine.create({
  username: username().unique({ table: 'users', column: 'username' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: newPassword(),
  passwordConfirmation: vine.string().sameAs('password'),
})

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

export const forgotPasswordValidator = vine.create({
  email: email(),
})

export const resetPasswordValidator = vine.create({
  password: newPassword(),
  passwordConfirmation: vine.string().sameAs('password'),
})

/**
 * Account page: username and email must stay unique, except for the
 * current user (given as metadata).
 */
export const updateProfileValidator = vine.withMetaData<{ userId: number }>().create({
  username: username().unique({
    table: 'users',
    column: 'username',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.userId)
    },
  }),
  email: email().unique({
    table: 'users',
    column: 'email',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.userId)
    },
  }),
  currentPassword: vine.string().optional(),
})

export const updatePasswordValidator = vine.create({
  currentPassword: vine.string(),
  password: newPassword(),
  passwordConfirmation: vine.string().sameAs('password'),
})

export const deleteAccountValidator = vine.create({
  password: vine.string(),
})
