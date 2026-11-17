import { useEffect, useRef } from 'react'

/**
 * Error about the whole form (wrong credentials, too many attempts…),
 * sent by the server under the "form" key and announced to screen readers.
 *
 * After a rejected submission it also moves the focus to the first field
 * in error (or to this message when no field is concerned).
 */
export default function FormAlert({ errors }: { errors: Record<string, string | undefined> }) {
  const message = errors.form
  const anchor = useRef<HTMLSpanElement>(null)
  const alert = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (Object.values(errors).every((value) => !value)) return
    const form = anchor.current?.closest('form')
    const field = form?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (field) field.focus()
    else if (alert.current) alert.current.focus()
  }, [errors])

  return (
    <>
      <span ref={anchor} hidden />
      {message && (
        <div ref={alert} className="form-alert" role="alert" tabIndex={-1}>
          {message}
        </div>
      )}
    </>
  )
}
