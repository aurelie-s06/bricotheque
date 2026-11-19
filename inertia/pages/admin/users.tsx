import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  q: string
  users: {
    id: number
    username: string
    email: string
    createdAt: string
    isAdmin: boolean
    isVerified: boolean
    sets: number
  }[]
  pagination: PaginationData
}>

export default function AdminUsers({ q, users, pagination }: Props) {
  const { t, tc, formatNumber, dateNode } = useI18n()
  return (
    <AdminShell title={t('admin.nav.users')}>
      <form className="search" role="search" action="/admin/utilisateurs" method="get">
        <label className="visually-hidden" htmlFor="users-q">
          {t('admin.users.search')}
        </label>
        <input
          id="users-q"
          className="input search__input"
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t('admin.users.searchPlaceholder')}
        />
        <button type="submit" className="btn btn--secondary">
          {t('search.submit')}
        </button>
      </form>

      <p className="text-muted" role="status">
        {tc('admin.users.count', pagination.total)}
      </p>
      {users.length === 0 ? (
        <p>{t('admin.users.none')}</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">{t('admin.nav.users')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('auth.username')}</th>
                <th scope="col">{t('auth.email')}</th>
                <th scope="col">{t('admin.users.status')}</th>
                <th scope="col">{t('admin.users.since')}</th>
                <th scope="col">{t('admin.users.sets')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <th scope="row">
                    <Link href={`/admin/utilisateurs/${user.id}`}>{user.username}</Link>
                    {user.isAdmin && <span className="admin-badge"> {t('admin.users.admin')}</span>}
                  </th>
                  <td>{user.email}</td>
                  <td>
                    {user.isVerified ? t('admin.users.verified') : t('admin.users.notVerified')}
                  </td>
                  <td>{dateNode(user.createdAt)}</td>
                  <td>{formatNumber(user.sets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} path="/admin/utilisateurs" query={q ? { q } : {}} />
    </AdminShell>
  )
}

AdminUsers.layout = [AppLayout]
