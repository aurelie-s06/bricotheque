import { type ReactNode } from 'react'

/**
 * Link to another website, announced as such (visually and to screen readers).
 */
export default function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="external-link" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> (site externe)</span>
    </a>
  )
}
