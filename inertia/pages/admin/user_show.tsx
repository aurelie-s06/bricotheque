import { type ReactNode } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import RequiredNotice from '~/components/required_notice'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Item = { number: string; name: string; url: string; quantity: number }

type Props = InertiaProps<{
  account: {
    id: number
    username: string
    email: string
    createdAt: string | null
    emailVerifiedAt: string | null
    isAdmin: boolean
    wishlistShared: boolean
    isSelf: boolean
  }
  counts: {
    sets: { owned: number; wanted: number }
    minifigs: { owned: number; wanted: number }
  }
  lists: { setsOwned: Item[]; setsWanted: Item[]; minifigsOwned: Item[]; minifigsWanted: Item[] }
  listLimit: number
}>

/** One card of the page, with its title */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="card admin-user__section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  )
}

/** Sets or minifigs of the user, with a link to each page */
function ItemList({ items, total, limit }: { items: Item[]; total: number; limit: number }) {
  const { t, formatNumber } = useI18n()
  if (total === 0) return <p className="text-muted">{t('admin.user.empty')}</p>
  return (
    <>
      <ul className="admin-user__items">
        {items.map((item) => (
          <li key={item.number}>
            <Link href={item.url}>
              {item.number} {item.name}
            </Link>
            {item.quantity > 1 && <span className="text-muted"> × {item.quantity}</span>}
          </li>
        ))}
      </ul>
      {total > limit && (
        <p className="text-muted">
          {t('admin.user.more', { shown: formatNumber(limit), total: formatNumber(total) })}
        </p>
      )}
    </>
  )
}

export default function AdminUserShow({ account, counts, lists, listLimit }: Props) {
  const { t, formatNumber, dateNode } = useI18n()
  const id = account.id

  return (
    <AdminShell
      title={account.username}
      parent={{ name: t('admin.nav.users'), url: '/admin/utilisateurs' }}
    >
      <dl className="admin-user__facts">
        <div>
          <dt>{t('auth.email')}</dt>
          <dd>
            <a href={`mailto:${account.email}`}>{account.email}</a>
          </dd>
        </div>
        <div>
          <dt>{t('admin.users.since')}</dt>
          <dd>{account.createdAt ? dateNode(account.createdAt) : '–'}</dd>
        </div>
        <div>
          <dt>{t('admin.user.emailStatus')}</dt>
          <dd>
            {account.emailVerifiedAt ? (
              <>
                {t('admin.users.verified')} ({dateNode(account.emailVerifiedAt)})
              </>
            ) : (
              <strong>{t('admin.users.notVerified')}</strong>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('admin.user.role')}</dt>
          <dd>{account.isAdmin ? t('admin.user.roleAdmin') : t('admin.user.roleMember')}</dd>
        </div>
        <div>
          <dt>{t('admin.user.wishlistShared')}</dt>
          <dd>{account.wishlistShared ? t('admin.user.yes') : t('admin.user.no')}</dd>
        </div>
      </dl>

      <dl className="stat-tiles">
        {(
          [
            ['admin.user.setsOwned', counts.sets.owned],
            ['admin.user.setsWanted', counts.sets.wanted],
            ['admin.user.minifigsOwned', counts.minifigs.owned],
            ['admin.user.minifigsWanted', counts.minifigs.wanted],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="stat-tile admin-tile">
            <dt className="stat-tile__label">{t(label)}</dt>
            <dd className="stat-tile__value">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="admin-user__grid">
        <Section id="sets-owned" title={t('admin.user.setsOwned')}>
          <ItemList items={lists.setsOwned} total={counts.sets.owned} limit={listLimit} />
        </Section>
        <Section id="sets-wanted" title={t('admin.user.setsWanted')}>
          <ItemList items={lists.setsWanted} total={counts.sets.wanted} limit={listLimit} />
        </Section>
        <Section id="minifigs-owned" title={t('admin.user.minifigsOwned')}>
          <ItemList items={lists.minifigsOwned} total={counts.minifigs.owned} limit={listLimit} />
        </Section>
        <Section id="minifigs-wanted" title={t('admin.user.minifigsWanted')}>
          <ItemList items={lists.minifigsWanted} total={counts.minifigs.wanted} limit={listLimit} />
        </Section>
      </div>

      <h2 className="admin-user__actions-title">{t('admin.user.actions')}</h2>
      {account.isSelf ? (
        <p className="text-muted">
          {t('admin.user.selfHint')} <Link href="/mon-compte">{t('account.title')}</Link>.
        </p>
      ) : (
        <div className="admin-user__grid">
          {!account.emailVerifiedAt && (
            <Section id="confirmation" title={t('admin.user.confirmationTitle')}>
              <p className="text-muted">{t('admin.user.confirmationHint')}</p>
              <Form route="admin.users.confirmation" routeParams={{ id }}>
                {({ processing }) => (
                  <button type="submit" className="btn" disabled={processing}>
                    {t('admin.user.confirmationButton')}
                  </button>
                )}
              </Form>
            </Section>
          )}

          <Section id="role" title={t('admin.user.roleTitle')}>
            <p className="text-muted">
              {account.isAdmin ? t('admin.user.removeAdminHint') : t('admin.user.giveAdminHint')}
            </p>
            <Form route="admin.users.role" routeParams={{ id }} options={{ preserveScroll: true }}>
              {({ errors, processing }) => (
                <>
                  <FormAlert errors={errors} />
                  <input type="hidden" name="admin" value={account.isAdmin ? '0' : '1'} />
                  <button type="submit" className="btn btn--secondary" disabled={processing}>
                    {account.isAdmin ? t('admin.user.removeAdmin') : t('admin.user.giveAdmin')}
                  </button>
                </>
              )}
            </Form>
          </Section>

          <Section id="delete" title={t('admin.user.deleteTitle')}>
            <p className="text-muted">{t('admin.user.deleteWarning')}</p>
            <Form
              route="admin.users.destroy"
              routeParams={{ id }}
              className="account-form"
              options={{ preserveScroll: true }}
            >
              {({ errors: formErrors, processing }) => {
                // fields checked on the server (not inferred from a validator)
                const errors = formErrors as Record<string, string | undefined>
                return (
                  <>
                    <FormAlert errors={errors} />
                    <RequiredNotice />
                    <div className="field field--checkbox">
                      <input type="checkbox" id="delete-understand" name="understand" required />
                      <label htmlFor="delete-understand">
                        {t('admin.user.deleteUnderstand')}
                        <span aria-hidden="true"> *</span>
                      </label>
                    </div>
                    {errors.understand && (
                      <p className="field__error" role="alert">
                        {errors.understand}
                      </p>
                    )}
                    <FormField
                      name="username"
                      id="delete-username"
                      label={t('admin.user.deleteUsername', { username: account.username })}
                      autoComplete="off"
                      spellCheck={false}
                      required
                      error={errors.username}
                    />
                    <div className="form-actions">
                      <button type="submit" className="btn btn--danger" disabled={processing}>
                        {processing ? t('form.saving') : t('admin.user.deleteButton')}
                      </button>
                    </div>
                  </>
                )
              }}
            </Form>
          </Section>
        </div>
      )}
    </AdminShell>
  )
}

AdminUserShow.layout = [AppLayout]
