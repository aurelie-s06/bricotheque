import { type ReactNode } from 'react'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { useI18n } from '~/i18n'

/**
 * Layout of the information pages (about, legal notice, privacy…):
 * breadcrumb, title and text column.
 */
export default function InfoPage({
  title,
  description,
  lead,
  children,
}: {
  title: string
  description: string
  lead?: ReactNode
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <>
      <Seo title={title} description={description} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: title }]} />
      <div className="page-header">
        <h1>{title}</h1>
        {lead && <p className="text-muted">{lead}</p>}
      </div>
      <div className="prose info-page">{children}</div>
    </>
  )
}

/** Value coming from .env, or a visible "to be completed" marker */
export function Filled({ value }: { value: string | null }) {
  const { t } = useI18n()
  return value ? <>{value}</> : <mark>{t('pages.toComplete')}</mark>
}
