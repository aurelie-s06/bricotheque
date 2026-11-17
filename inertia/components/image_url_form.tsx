import { useState } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'
import { displaySetNum } from '~/lib/set_number'

export type AdminImageItem = {
  kind: 'sets' | 'minifigs'
  id: number
  number: string
  name: string
  url: string
  importedUrl: string | null
  manualUrl: string | null
  broken: boolean
}

/**
 * Field to paste the URL of a picture, with a preview before saving. The
 * server checks that it is an https address of a picture.
 */
export default function ImageUrlForm({ item }: { item: AdminImageItem }) {
  const { t } = useI18n()
  const [value, setValue] = useState(item.manualUrl ?? '')
  const [preview, setPreview] = useState<'idle' | 'ok' | 'error'>(value ? 'ok' : 'idle')
  const fieldId = `image-${item.kind}-${item.id}`
  const previewUrl = value.startsWith('https://') ? value : null

  return (
    <article className="card admin-image">
      <div className="admin-image__preview" aria-live="polite">
        {previewUrl ? (
          <img
            key={previewUrl}
            src={previewUrl}
            alt={t('admin.image.previewAlt', { name: item.name })}
            onLoad={() => setPreview('ok')}
            onError={() => setPreview('error')}
          />
        ) : (
          <span className="text-muted">{t('admin.image.noPreview')}</span>
        )}
        {previewUrl && preview === 'error' && (
          <p className="field__error">{t('admin.image.previewError')}</p>
        )}
      </div>
      <div className="admin-image__body">
        <h2 className="admin-image__title">
          <Link href={item.url}>
            {item.kind === 'sets' ? displaySetNum(item.number) : item.number} {item.name}
          </Link>
        </h2>
        <p className="text-muted admin-image__state">
          {item.broken
            ? t('admin.image.stateBroken')
            : item.manualUrl
              ? t('admin.image.stateManual')
              : item.importedUrl
                ? t('admin.image.stateImported')
                : t('admin.image.stateMissing')}
        </p>
        <Form
          route="admin.images.update"
          routeParams={{ kind: item.kind, id: item.id }}
          className="admin-image__form"
        >
          {({ errors: formErrors, processing }) => {
            const errors = formErrors as Record<string, string | undefined>
            return (
              <>
                <div className="field">
                  <label className="field__label" htmlFor={fieldId}>
                    {t('admin.image.urlLabel')}
                  </label>
                  <p className="field__hint" id={`${fieldId}-hint`}>
                    {t('admin.image.urlHint')}
                  </p>
                  <input
                    className="field__input"
                    id={fieldId}
                    name="url"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value)
                      setPreview('idle')
                    }}
                    aria-invalid={errors.url ? 'true' : undefined}
                    aria-describedby={`${fieldId}-hint${errors.url ? ` ${fieldId}-error` : ''}`}
                  />
                  {errors.url && (
                    <p className="field__error" id={`${fieldId}-error`}>
                      {errors.url}
                    </p>
                  )}
                </div>
                <div className="admin-image__actions">
                  <button type="submit" className="btn" disabled={processing}>
                    {processing ? t('form.saving') : t('admin.image.save')}
                  </button>
                </div>
              </>
            )
          }}
        </Form>
      </div>
    </article>
  )
}
