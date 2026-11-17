import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  figures: {
    sets: number
    minifigs: number
    users: number
    setsWithoutImage: number
    minifigsWithoutImage: number
    untranslated: number
  }
  lastUpdate: string | null
}>

function Tile({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="stat-tile admin-tile">
      <dt className="stat-tile__label">{label}</dt>
      <dd className="stat-tile__value">{href ? <Link href={href}>{value}</Link> : value}</dd>
    </div>
  )
}

export default function AdminDashboard({ figures, lastUpdate }: Props) {
  const { t, formatNumber, dateNode } = useI18n()
  return (
    <AdminShell title={t('admin.nav.dashboard')}>
      <dl className="stat-tiles">
        <Tile label={t('admin.figures.sets')} value={formatNumber(figures.sets)} />
        <Tile label={t('admin.figures.minifigs')} value={formatNumber(figures.minifigs)} />
        <Tile
          label={t('admin.figures.users')}
          value={formatNumber(figures.users)}
          href="/admin/utilisateurs"
        />
        <Tile
          label={t('admin.figures.setsWithoutImage')}
          value={formatNumber(figures.setsWithoutImage)}
          href="/admin/images?type=sets"
        />
        <Tile
          label={t('admin.figures.minifigsWithoutImage')}
          value={formatNumber(figures.minifigsWithoutImage)}
          href="/admin/images?type=minifigs"
        />
        <Tile label={t('admin.figures.untranslated')} value={formatNumber(figures.untranslated)} />
      </dl>
      <p>
        {t('admin.lastUpdate')} {lastUpdate ? dateNode(lastUpdate) : t('admin.never')} ·{' '}
        <Link href="/admin/mises-a-jour">{t('admin.nav.updates')}</Link>
      </p>
    </AdminShell>
  )
}

AdminDashboard.layout = [AppLayout]
