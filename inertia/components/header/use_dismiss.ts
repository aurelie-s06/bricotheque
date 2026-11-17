import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'

/**
 * Closes a <details> dropdown on Escape, on a click outside and when the
 * page changes. Without JavaScript the <details> still opens and closes.
 */
export function useDismissableDetails() {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const close = (returnFocus = false) => {
      const details = ref.current
      if (details?.open) {
        details.open = false
        if (returnFocus) {
          details.querySelector('summary')?.focus()
        }
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    const stopListening = router.on('navigate', () => close())
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      stopListening()
    }
  }, [])

  return ref
}
