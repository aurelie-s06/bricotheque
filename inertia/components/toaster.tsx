import { useCallback, useEffect, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { notify, onNotify, type Toast, type ToastType } from '~/lib/notify'
import { useI18n } from '~/i18n'

/** Time on screen of the success and info toasts (errors stay until closed) */
const DURATION_MS = 5000

const ICONS = { success: CircleCheck, info: Info, error: CircleAlert }

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const { t } = useI18n()
  const Icon = ICONS[toast.type]
  const timer = useRef<number | null>(null)
  const remaining = useRef(DURATION_MS)
  const startedAt = useRef(0)

  const start = useCallback(() => {
    if (toast.type === 'error') return
    startedAt.current = Date.now()
    timer.current = window.setTimeout(() => onClose(toast.id), remaining.current)
  }, [toast, onClose])

  // Paused while hovered or focused, so the message can be read
  const pause = useCallback(() => {
    if (timer.current === null) return
    window.clearTimeout(timer.current)
    timer.current = null
    remaining.current -= Date.now() - startedAt.current
  }, [])

  useEffect(() => {
    start()
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [start])

  return (
    <li
      className={`toast toast--${toast.type}`}
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) start()
      }}
    >
      <Icon size={20} aria-hidden="true" className="toast__icon" />
      <p className="toast__message">{toast.message}</p>
      <button
        type="button"
        className="toast__close"
        onClick={() => onClose(toast.id)}
        title={t('toast.close')}
      >
        <X size={18} aria-hidden="true" />
        <span className="visually-hidden">{t('toast.close')}</span>
      </button>
    </li>
  )
}

/**
 * Notifications of the site: the flash messages of the server and the
 * notify() calls of the page. Success and info are announced politely
 * (role="status"), errors at once (role="alert"). Both live regions are
 * always in the page so that screen readers announce what is added.
 */
export default function Toaster() {
  const { flash } = usePage()
  const [toasts, setToasts] = useState<Toast[]>([])

  const close = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  useEffect(
    () =>
      onNotify((toast) =>
        // The same message twice in a row is shown once
        setToasts((current) => [...current.filter((item) => item.message !== toast.message), toast])
      ),
    []
  )

  useEffect(() => {
    for (const type of ['error', 'info', 'success'] as ToastType[]) {
      const message = flash[type]
      if (message) notify(message, type)
    }
  }, [flash])

  const errors = toasts.filter((toast) => toast.type === 'error')
  const others = toasts.filter((toast) => toast.type !== 'error')

  return (
    <div className="toaster">
      <ul role="alert" className="toaster__list">
        {errors.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={close} />
        ))}
      </ul>
      <ul role="status" aria-live="polite" className="toaster__list">
        {others.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={close} />
        ))}
      </ul>
    </div>
  )
}
