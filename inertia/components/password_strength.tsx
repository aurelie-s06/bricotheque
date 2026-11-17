import { useI18n } from '~/i18n'

export type Strength = 0 | 1 | 2 | 3 | 4

/**
 * Rough strength of a password: length first, then variety of characters,
 * minus obvious patterns (repeated or sequential characters, common words).
 */
export function passwordStrength(password: string): Strength {
  if (!password) return 0
  let score = 0
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (password.length >= 20) score++
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((re) => re.test(password)).length
  if (kinds >= 3) score++
  if (
    /(.)\1{2,}/.test(password) ||
    /(0123|1234|2345|abcd|azerty|qwerty|password|motdepasse)/i.test(password)
  ) {
    score--
  }
  if (password.length < 10) score = Math.min(score, 1)
  return Math.max(1, Math.min(4, score)) as Strength
}

const LABELS = {
  1: 'form.strengthWeak',
  2: 'form.strengthFair',
  3: 'form.strengthGood',
  4: 'form.strengthStrong',
} as const

/**
 * Strength meter under a new password field (Opquast rule 203). The text
 * is announced politely by screen readers; the bar is decorative.
 */
export default function PasswordStrength({ password, id }: { password: string; id: string }) {
  const { t } = useI18n()
  const strength = passwordStrength(password)
  return (
    <div className="password-strength" data-strength={strength}>
      <div className="password-strength__bar" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={step <= strength ? 'is-on' : undefined} />
        ))}
      </div>
      <p id={id} className="password-strength__text" aria-live="polite">
        {strength > 0 ? t('form.strength', { level: t(LABELS[strength as 1]) }) : ' '}
      </p>
    </div>
  )
}
