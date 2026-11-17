/**
 * Minimal CSV writer: quotes every field that needs it (separator, quote,
 * line break) and neutralises spreadsheet formulas (=, +, -, @ at the start
 * of a text cell, a common injection vector).
 */
export function toCsv(rows: unknown[][], separator = ';') {
  const cell = (value: unknown) => {
    if (value === null || value === undefined) return ''
    let text = String(value)
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
      text = `'${text}`
    }
    return /["\n\r]/.test(text) || text.includes(separator) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return rows.map((row) => row.map(cell).join(separator)).join('\r\n') + '\r\n'
}
