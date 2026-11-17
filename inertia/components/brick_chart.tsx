import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

export type BrickChartRow = { label: string; url?: string | null; value: number }

/** Bricks of the longest bar; the others are proportional */
const MAX_BRICKS = 20

/**
 * Horizontal bar chart drawn with stacked bricks (rounded blocks separated
 * by 2 px). It is a real table: the numbers are always written next to
 * the bars, the bars themselves are decorative (aria-hidden).
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
          const bricks = row.value > 0 ? Math.max(1, Math.round((row.value / max) * MAX_BRICKS)) : 0
          let label: ReactNode = row.label
          if (row.url) label = <Link href={row.url}>{row.label}</Link>
          return (
            <tr key={`${row.label}-${index}`}>
              <th scope="row" className="brick-chart__label">
                {label}
              </th>
              <td className="brick-chart__cell" title={`${row.label} : ${formatNumber(row.value)}`}>
                <span className="brick-chart__bar" aria-hidden="true">
                  {Array.from({ length: bricks }, (_, brick) => (
                    <span key={brick} className="brick-chart__brick" />
                  ))}
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
