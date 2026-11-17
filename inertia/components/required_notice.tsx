import { useI18n } from '~/i18n'

/**
 * "Fields marked with an asterisk (*) are required.": placed just above
 * the first field of every form that has required fields.
 */
export default function RequiredNotice() {
  const { t } = useI18n()
  return <p className="required-notice">{t('form.requiredNotice')}</p>
}
