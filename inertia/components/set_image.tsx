import { useEffect, useRef, useState } from 'react'

const PLACEHOLDER = '/images/placeholder-set.svg'

/**
 * Image served by the Rebrickable CDN (never downloaded), lazy-loaded,
 * with a placeholder when the URL is empty or broken.
 */
export default function SetImage({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string | null
  alt: string
  className?: string
  eager?: boolean
}) {
  const [broken, setBroken] = useState(false)
  const image = useRef<HTMLImageElement>(null)

  // The error event can fire before hydration: check the image once mounted
  useEffect(() => {
    const element = image.current
    if (element && element.complete && element.naturalWidth === 0 && src) {
      setBroken(true)
    }
  }, [src])

  return (
    <img
      ref={image}
      className={`set-image ${className}`.trim()}
      src={!src || broken ? PLACEHOLDER : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}
