/**
 * Notifications ("toasts") shown by the <Toaster> of the layout.
 *
 * - Server: `session.flash('success' | 'info' | 'error', message)` before a
 *   redirect; the Toaster shows the flash messages of each page.
 * - Browser, for actions without a page load: `notify('Lien copié')` or
 *   `notify('Erreur…', 'error')`.
 */
export type ToastType = 'success' | 'info' | 'error'

export type Toast = { id: number; type: ToastType; message: string }

type Listener = (toast: Toast) => void

const listeners = new Set<Listener>()
let lastId = 0

export function notify(message: string, type: ToastType = 'success') {
  const toast = { id: ++lastId, type, message }
  for (const listener of listeners) listener(toast)
  return toast.id
}

/** Used by the Toaster; returns the unsubscribe function */
export function onNotify(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
