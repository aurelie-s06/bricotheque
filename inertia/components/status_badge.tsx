import { useI18n } from '~/i18n'

const SHOWN = ['upcoming', 'available', 'retired'] as const

/**
 * Small brick-shaped badge: "Bientôt" (blue), "En vente" (green) or
 * "Retiré" (red). Nothing is shown when the status is unknown.
 */
export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  if (!(SHOWN as readonly string[]).includes(status)) {
    return null
  }
  const shown = status as (typeof SHOWN)[number]
  return <span className={`badge badge--${shown}`}>{t(`status.${shown}`)}</span>
}
