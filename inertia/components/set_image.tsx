import { useEffect, useRef, useState } from 'react'

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
}: {
  src: string | null
  alt: string
  className?: string
  eager?: boolean
  thumb?: boolean
}) {
  const thumbnail = thumb ? thumbnailOf(src) : null
  // 0: thumbnail (or full picture), 1: full picture, 2: placeholder
  const [stage, setStage] = useState(thumbnail ? 0 : 1)
  const image = useRef<HTMLImageElement>(null)

  const next = () => setStage((current) => (current === 0 ? 1 : 2))

  // The error event can fire before hydration: check the image once mounted
  useEffect(() => {
    const element = image.current
    if (element && element.complete && element.naturalWidth === 0 && src) {
      next()
    }
  }, [src])

  const current = !src || stage === 2 ? PLACEHOLDER : stage === 0 && thumbnail ? thumbnail : src
  const srcSet =
    stage === 0 && thumbnail ? `${thumbnail} 1x, ${thumbnailOf(src, 500)} 2x` : undefined

  return (
    <img
      ref={image}
      className={`set-image ${className}`.trim()}
      src={current}
      srcSet={srcSet}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={next}
    />
  )
}
