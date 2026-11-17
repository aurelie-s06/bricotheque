import { usePage } from '@inertiajs/react'

/**
 * Success message of the previous action, shown inside the page (in
 * addition to the toast) so it stays readable.
 */
export default function FlashNotice() {
  const { flash } = usePage()
  if (!flash.success && !flash.error) {
    return null
  }
  return (
    <div
      className={`form-alert ${flash.success ? 'form-alert--success' : ''}`}
      role={flash.success ? 'status' : 'alert'}
    >
      {flash.success ?? flash.error}
    </div>
  )
}
