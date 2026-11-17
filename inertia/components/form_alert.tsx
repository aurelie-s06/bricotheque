/**
 * Error about the whole form (wrong credentials, too many attempts…),
 * sent by the server under the "form" key and announced to screen readers.
 */
export default function FormAlert({ errors }: { errors: Record<string, string | undefined> }) {
  const message = errors.form
  if (!message) {
    return null
  }
  return (
    <div className="form-alert" role="alert">
      {message}
    </div>
  )
}
