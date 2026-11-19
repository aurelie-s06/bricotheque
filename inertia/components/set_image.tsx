import { useCallback, useEffect, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'

const PLACEHOLDER = '/images/placeholder-set.svg'
const REBRICKABLE = 'https://cdn.rebrickable.com/media/sets/'

/**
 * Thumbnail made by the Rebrickable CDN for lists (Opquast rule 119: no
 * large picture shrunk by the browser). Null for other hosts.
 */
export function thumbnailOf(src: string | null, size: 250 | 500 = 250) {
  if (!src?.startsWith(REBRICKABLE)) return null
  const file = src.slice(REBRICKABLE.length)
  return `https://cdn.rebrickable.com/media/thumbs/sets/${file}/${size}x${size}p.jpg`
}

/**
 * Image served by the Rebrickable CDN (never downloaded), lazy-loaded,
 * with a placeholder when the URL is empty or broken. `thumb` uses the
 * CDN thumbnails (250 px, 500 px on high-density screens) and falls back
 * on the full picture if they are missing.
 */
export default function SetImage({
  src,
  alt,
  className = '',
  eager = false,
  thumb = false,
  item,
}: {
  src: string | null
  alt: string
  className?: string
  eager?: boolean
  thumb?: boolean
  /** Set or minifig shown: a broken picture is reported to the back office */
  item?: { kind: 'sets' | 'minifigs'; id: number }
}) {
  const { props } = usePage()
  const isAdmin = props.user?.isAdmin === true
  const thumbnail = thumb ? thumbnailOf(src) : null
  // 0: thumbnail (or full picture), 1: full picture, 2: placeholder
  const [stage, setStage] = useState(thumbnail ? 0 : 1)
  const image = useRef<HTMLImageElement>(null)

  const reported = useRef(false)

  // Fade-in once loaded. Only after hydration: without JavaScript (or for
  // a picture already in the cache) the picture shows at once, never hidden.
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const element = image.current
    if (element && !element.complete) setLoading(true)
  }, [])

  const next = useCallback(() => setStage((current) => (current === 0 ? 1 : 2)), [])

  // The error event can fire before hydration: check the image once mounted
  useEffect(() => {
    const element = image.current
    if (element && element.complete && element.naturalWidth === 0 && src) {
      next()
    }
  }, [src, next])

  // Neither the thumbnail nor the picture loads: an administrator's browser
  // reports it, so the item appears in the back office list
  useEffect(() => {
    if (stage !== 2 || !src || !item || !isAdmin || reported.current) return
    reported.current = true
    void fetch(`/admin/images/${item.kind}/${item.id}/cassee`, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': props.csrfToken },
    })
  }, [stage, src, item, isAdmin, props.csrfToken])

  const current = !src || stage === 2 ? PLACEHOLDER : stage === 0 && thumbnail ? thumbnail : src
  const srcSet =
    stage === 0 && thumbnail ? `${thumbnail} 1x, ${thumbnailOf(src, 500)} 2x` : undefined

  return (
    <img
      ref={image}
      className={`set-image ${loading ? 'set-image--loading' : ''} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      src={current}
      srcSet={srcSet}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoading(false)}
      onError={() => {
        setLoading(false)
        next()
      }}
    />
  )
}
