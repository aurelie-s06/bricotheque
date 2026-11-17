import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

export type BrickChartRow = { label: string; url?: string | null; value: number }

/**
 * Sober horizontal bar chart: one dark grey bar per row on a light track,
 * its length proportional to the largest value. It is a real table: the
 * numbers are always written next to the bars, the bars themselves are
 * decorative (aria-hidden).
 */
export default function BrickChart({
  caption,
  labelHeader,
  valueHeader,
  rows,
}: {
  caption: string
  labelHeader: string
  valueHeader: string
  rows: BrickChartRow[]
}) {
  const { formatNumber } = useI18n()
  const max = Math.max(1, ...rows.map((row) => row.value))

  return (
    <table className="brick-chart">
      <caption className="visually-hidden">{caption}</caption>
      <thead className="visually-hidden">
        <tr>
          <th scope="col">{labelHeader}</th>
          <th scope="col">{valueHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          // At least a sliver for a non-zero value, so it stays visible
          const percent = row.value > 0 ? Math.max(2, (row.value / max) * 100) : 0
          let label: ReactNode = row.label
          if (row.url) label = <Link href={row.url}>{row.label}</Link>
          return (
            <tr key={`${row.label}-${index}`}>
              <th scope="row" className="brick-chart__label">
                {label}
              </th>
              <td className="brick-chart__cell" title={`${row.label} : ${formatNumber(row.value)}`}>
                <span className="brick-chart__track" aria-hidden="true">
                  <span className="brick-chart__bar" style={{ width: `${percent}%` }} />
                </span>
                <span className="brick-chart__value">{formatNumber(row.value)}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
