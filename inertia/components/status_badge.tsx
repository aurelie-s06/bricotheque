import { STATUS_LABELS } from '~/lib/format'

/**
 * Small brick-shaped badge: "En vente" (green) or "Retiré" (red).
 * Nothing is shown when the status is unknown.
 */
export default function StatusBadge({ status }: { status: string }) {
  if (status !== 'available' && status !== 'retired') {
    return null
  }
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>
}
