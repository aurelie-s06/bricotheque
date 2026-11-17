import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  users: {
    id: number
    username: string
    email: string
    createdAt: string
    isAdmin: boolean
    sets: number
  }[]
  pagination: PaginationData
}>

export default function AdminUsers({ users, pagination }: Props) {
  const { t, tc, formatNumber, dateNode } = useI18n()
  return (
    <AdminShell title={t('admin.nav.users')}>
      <p className="text-muted" role="status">
        {tc('admin.users.count', pagination.total)}
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <caption className="visually-hidden">{t('admin.nav.users')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('auth.username')}</th>
              <th scope="col">{t('auth.email')}</th>
              <th scope="col">{t('admin.users.since')}</th>
              <th scope="col">{t('admin.users.sets')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <th scope="row">
                  {user.username}
                  {user.isAdmin && <span className="admin-badge"> {t('admin.users.admin')}</span>}
                </th>
                <td>{user.email}</td>
                <td>{dateNode(user.createdAt)}</td>
                <td>{formatNumber(user.sets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} path="/admin/utilisateurs" />
    </AdminShell>
  )
}

AdminUsers.layout = [AppLayout]
