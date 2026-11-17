import { useState, type InputHTMLAttributes } from 'react'
import { useI18n } from '~/i18n'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> & {
  name: string
  label: string
  hint?: string
  error?: string
}

/**
 * Labelled input with its hint and its error, both linked to the input
 * (aria-describedby). Required fields are marked with an asterisk.
 */
export default function FormField({ name, label, hint, error, required, ...input }: FieldProps) {
  const { t } = useI18n()
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const [visible, setVisible] = useState(false)
  const isPassword = input.type === 'password'

  return (
    <div className="field">
      <label className="field__label" htmlFor={name}>
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
          id={name}
          name={name}
          required={required}
          className="field__input"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            type="button"
            className="btn btn--secondary btn--sm password-input__toggle"
            aria-pressed={visible}
            aria-controls={name}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? t('form.hidePassword') : t('form.showPassword')}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
