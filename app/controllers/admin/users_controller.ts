import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import EmailVerification from '#services/email_verification'
import { backWithErrors } from '#helpers/form_errors'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { minifigPath, setPath } from '#helpers/urls'
import { validationMessages } from '#validators/messages'

const PER_PAGE = 50
/** Items shown per list on the user page (the total is always shown) */
const LIST_LIMIT = 100

const roleValidator = vine.create({ admin: vine.boolean() })
const deleteValidator = vine.create({
  understand: vine.accepted(),
  username: vine.string().trim().maxLength(100),
})

async function findUser(id: unknown) {
  const user = await User.find(Number(id) || 0)
  if (!user) throw new Exception('Utilisateur introuvable', { status: 404, code: 'E_NOT_FOUND' })
  return user
}

const isoDate = (value: unknown) => (value ? new Date(String(value)).toISOString() : null)

/** Sets of one user with a status (owned / wanted), newest first */
async function userSets(userId: number, status: 'owned' | 'wanted') {
  const rows = await db
    .from('user_sets')
    .join('sets', 'sets.id', 'user_sets.set_id')
    .where('user_sets.user_id', userId)
    .where('user_sets.status', status)
    .orderBy('user_sets.created_at', 'desc')
    .select('sets.set_num', 'sets.slug', 'sets.name', 'user_sets.quantity')
    .limit(LIST_LIMIT)
  return rows.map((row) => ({
    number: String(row.set_num),
    name: String(row.name),
    url: setPath({ setNum: row.set_num, slug: row.slug }),
    quantity: Number(row.quantity),
  }))
}

/** Minifigs of one user with a status (owned / wanted), newest first */
async function userMinifigs(userId: number, status: 'owned' | 'wanted') {
  const rows = await db
    .from('user_minifigs')
    .join('minifigs', 'minifigs.id', 'user_minifigs.minifig_id')
    .where('user_minifigs.user_id', userId)
    .where('user_minifigs.status', status)
    .orderBy('user_minifigs.created_at', 'desc')
    .select('minifigs.fig_num', 'minifigs.slug', 'minifigs.name', 'user_minifigs.quantity')
    .limit(LIST_LIMIT)
  return rows.map((row) => ({
    number: String(row.fig_num),
    name: String(row.name),
    url: minifigPath({ figNum: row.fig_num, slug: row.slug }),
    quantity: Number(row.quantity),
  }))
}

async function countByStatus(table: 'user_sets' | 'user_minifigs', userId: number) {
  const rows = await db
    .from(table)
    .where('user_id', userId)
    .groupBy('status')
    .select('status')
    .count('* as total')
  const total = (status: string) => Number(rows.find((row) => row.status === status)?.total ?? 0)
  return { owned: total('owned'), wanted: total('wanted') }
}

/**
 * Back office: list, search and manage the accounts (confirmation email,
 * administrator role, deletion).
 */
export default class UsersController {
  /** GET /admin/utilisateurs?q=&page= */
  async index({ inertia, request }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const q = String(request.input('q', '')).trim().slice(0, 100)

    const query = db
      .from('users')
      .leftJoin('user_sets', (join) => {
        join.on('user_sets.user_id', 'users.id').andOnVal('user_sets.status', 'owned')
      })
      .groupBy(
        'users.id',
        'users.username',
        'users.email',
        'users.created_at',
        'users.is_admin',
        'users.email_verified_at'
      )
      .orderBy('users.created_at', 'desc')
      .select(
        'users.id',
        'users.username',
        'users.email',
        'users.created_at',
        'users.is_admin',
        'users.email_verified_at'
      )
      .count('user_sets.id as sets')
    if (q) {
      query.where((sub) =>
        sub
          .whereRaw('`users`.`username` LIKE ?', [`%${q}%`])
          .orWhereRaw('`users`.`email` LIKE ?', [`%${q}%`])
      )
    }
    const result = await query.paginate(page, PER_PAGE)

    return inertia.render('admin/users', {
      q,
      users: result.all().map((row) => ({
        id: Number(row.id),
        username: String(row.username),
        email: String(row.email),
        createdAt: new Date(row.created_at).toISOString().slice(0, 10),
        isAdmin: Boolean(row.is_admin),
        isVerified: Boolean(row.email_verified_at),
        sets: Number(row.sets),
      })),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        total: result.total,
        perPage: result.perPage,
      },
    })
  }

  /** GET /admin/utilisateurs/:id */
  async show({ inertia, params, auth }: HttpContext) {
    const user = await findUser(params.id)
    return inertia.render('admin/user_show', {
      account: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: isoDate(user.createdAt.toISO()),
        emailVerifiedAt: user.emailVerifiedAt ? isoDate(user.emailVerifiedAt.toISO()) : null,
        isAdmin: user.isAdmin,
        wishlistShared: Boolean(user.wishlistShareToken),
        isSelf: user.id === auth.user!.id,
      },
      counts: {
        sets: await countByStatus('user_sets', user.id),
        minifigs: await countByStatus('user_minifigs', user.id),
      },
      lists: {
        setsOwned: await userSets(user.id, 'owned'),
        setsWanted: await userSets(user.id, 'wanted'),
        minifigsOwned: await userMinifigs(user.id, 'owned'),
        minifigsWanted: await userMinifigs(user.id, 'wanted'),
      },
      listLimit: LIST_LIMIT,
    })
  }

  /** POST /admin/utilisateurs/:id/confirmation: sends the confirmation link again */
  async resendConfirmation({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const user = await findUser(params.id)
    if (user.emailVerifiedAt) {
      session.flash('info', serverMessage(locale, 'admin.users.alreadyVerified'))
    } else {
      await EmailVerification.send(user, locale)
      session.flash(
        'success',
        serverMessage(locale, 'admin.users.confirmationSent', {
          email: user.email,
        })
      )
    }
    return response.redirect().back()
  }

  /** PUT /admin/utilisateurs/:id/role: gives or removes the administrator role */
  async updateRole(ctx: HttpContext) {
    const { params, request, session, response, auth } = ctx
    const locale = resolveLocale(request)
    const user = await findUser(params.id)
    const { admin } = await request.validateUsing(roleValidator)
    // An administrator never removes their own access by mistake
    if (user.id === auth.user!.id) {
      return backWithErrors(ctx, { form: serverMessage(locale, 'admin.users.notSelf') })
    }
    user.isAdmin = admin
    await user.save()
    session.flash(
      'success',
      serverMessage(locale, admin ? 'admin.users.adminGiven' : 'admin.users.adminRemoved', {
        username: user.username,
      })
    )
    return response.redirect().back()
  }

  /**
   * DELETE /admin/utilisateurs/:id: the collection and the wishlist are
   * deleted with the account (foreign keys in cascade).
   */
  async destroy(ctx: HttpContext) {
    const { params, request, session, response, auth } = ctx
    const locale = resolveLocale(request)
    const user = await findUser(params.id)
    if (user.id === auth.user!.id) {
      return backWithErrors(ctx, { form: serverMessage(locale, 'admin.users.notSelf') })
    }
    const { username } = await request.validateUsing(deleteValidator, {
      messagesProvider: validationMessages(locale),
    })
    if (username !== user.username) {
      return backWithErrors(ctx, { username: serverMessage(locale, 'admin.users.wrongUsername') })
    }
    await user.delete()
    session.flash(
      'success',
      serverMessage(locale, 'admin.users.deleted', { username: user.username })
    )
    return response.redirect().toRoute('admin.users')
  }
}
