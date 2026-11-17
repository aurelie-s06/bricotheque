import { useI18n } from '~/i18n'

/**
 * Small brick-shaped badge: "En vente" (green) or "Retiré" (red).
 * Nothing is shown when the status is unknown.
 */
export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  if (status !== 'available' && status !== 'retired') {
    return null
  }
  return <span className={`badge badge--${status}`}>{t(`status.${status}`)}</span>
}
