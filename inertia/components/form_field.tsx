import { useState, type InputHTMLAttributes } from 'react'
import { useI18n } from '~/i18n'
import PasswordStrength from '~/components/password_strength'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> & {
  name: string
  label: string
  hint?: string
  error?: string
  /** Strength meter under a new password */
  strengthMeter?: boolean
  /** HTML id, when the same field name appears in several forms of a page */
  id?: string
}

/**
 * Labelled input with its hint and its error, both linked to the input
 * (aria-describedby). Required fields are marked with an asterisk.
 */
export default function FormField({
  name,
  label,
  hint,
  error,
  required,
  strengthMeter = false,
  id = name,
  ...input
}: FieldProps) {
  const { t } = useI18n()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const strengthId = strengthMeter ? `${id}-strength` : undefined
  const describedBy = [hintId, strengthId, errorId].filter(Boolean).join(' ') || undefined
  const [visible, setVisible] = useState(false)
  const [typed, setTyped] = useState('')
  const isPassword = input.type === 'password'

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="visually-hidden"> ({t('form.required')})</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      <div className={isPassword ? 'password-input' : undefined}>
        <input
          {...input}
          type={isPassword && visible ? 'text' : input.type}
          id={id}
          name={name}
          required={required}
          className="field__input"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          onInput={
            strengthMeter
              ? (event) => setTyped((event.target as HTMLInputElement).value)
              : input.onInput
          }
        />
        {isPassword && (
          <button
            type="button"
            className="btn btn--secondary btn--sm password-input__toggle"
            aria-pressed={visible}
            aria-controls={id}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? t('form.hidePassword') : t('form.showPassword')}
          </button>
        )}
      </div>
      {strengthMeter && <PasswordStrength password={typed} id={strengthId!} />}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
