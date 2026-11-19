import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import { displaySetNum } from '~/lib/set_number'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Kind = 'sets' | 'minifigs'
type Item = { id: number; number: string; name: string; url: string }

type Props = InertiaProps<{
  kind: Kind
  items: (Item & { duplicates: Item[] })[]
}>

/** Merge form of one manual item: a probable duplicate, or a number typed by hand */
function MergeForm({ kind, item }: { kind: Kind; item: Item & { duplicates: Item[] } }) {
  const { t } = useI18n()
  const label = (entry: Item) =>
    `${kind === 'sets' ? displaySetNum(entry.number) : entry.number} ${entry.name}`
  const errorKey = `target-${item.id}`
  const prefix = `merge-${item.id}`

  return (
    <Form
      route="admin.manual.merge"
      routeParams={{ kind, id: item.id }}
      className="admin-merge"
      options={{ preserveScroll: true }}
    >
      {({ errors: formErrors, processing }) => {
        const errors = formErrors as Record<string, string | undefined>
        const error = errors[errorKey] ?? errors.targetId ?? errors.target
        return (
          <>
            {item.duplicates.length > 0 ? (
              <fieldset className="admin-edit__fields">
                <legend className="field__label">{t('admin.manual.duplicates')}</legend>
                {item.duplicates.map((duplicate, index) => (
                  <div key={duplicate.id} className="field field--checkbox">
                    <input
                      type="radio"
                      id={`${prefix}-${duplicate.id}`}
                      name="targetId"
                      value={duplicate.id}
                      defaultChecked={index === 0}
                    />
                    <label htmlFor={`${prefix}-${duplicate.id}`}>
                      {label(duplicate)}{' '}
                      <Link href={duplicate.url} className="text-muted">
                        ({t('admin.manual.see')})
                      </Link>
                    </label>
                  </div>
                ))}
              </fieldset>
            ) : (
              <p className="text-muted">{t('admin.manual.noDuplicate')}</p>
            )}
            <div className="field">
              <label className="field__label" htmlFor={`${prefix}-target`}>
                {item.duplicates.length
                  ? t('admin.manual.otherNumber')
                  : t('admin.manual.targetNumber')}
              </label>
              <p className="field__hint" id={`${prefix}-hint`}>
                {kind === 'sets'
                  ? t('admin.manual.setNumberHint')
                  : t('admin.manual.figNumberHint')}
              </p>
              <input
                id={`${prefix}-target`}
                name="target"
                className="field__input"
                autoComplete="off"
                spellCheck={false}
                aria-describedby={error ? `${prefix}-hint ${prefix}-error` : `${prefix}-hint`}
                aria-invalid={error ? 'true' : undefined}
              />
              {error && (
                <p id={`${prefix}-error`} className="field__error">
                  {error}
                </p>
              )}
            </div>
            <div className="field field--checkbox">
              <input type="checkbox" id={`${prefix}-confirm`} name="confirm" required />
              <label htmlFor={`${prefix}-confirm`}>
                {t('admin.manual.confirm')}
                <span aria-hidden="true"> *</span>
              </label>
            </div>
            {errors.confirm && <p className="field__error">{errors.confirm}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn--secondary" disabled={processing}>
                {t('admin.manual.mergeButton')}
              </button>
            </div>
          </>
        )
      }}
    </Form>
  )
}

export default function AdminManual({ kind, items }: Props) {
  const { t, tc } = useI18n()
  const toMerge = items.filter((item) => item.duplicates.length > 0).length

  return (
    <AdminShell title={t('admin.nav.manual')}>
      <p className="text-muted">{t('admin.manual.lead')}</p>
      <div className="translations-toolbar">
        <nav className="tabs" aria-label={t('admin.image.tabs')}>
          <ul className="tabs__list">
            {(['sets', 'minifigs'] as const).map((type) => (
              <li key={type}>
                <Link
                  href={`/admin/ajouts?type=${type}`}
                  className="tabs__link"
                  aria-current={kind === type ? 'page' : undefined}
                >
                  {t(type === 'sets' ? 'nav.sets' : 'nav.minifigs')}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href={`/admin/ajouts/nouveau?type=${kind}`} className="btn">
          {kind === 'sets' ? t('admin.manual.addSet') : t('admin.manual.addMinifig')}
        </Link>
      </div>

      <p className="text-muted" role="status">
        {tc('admin.manual.count', items.length)}
        {toMerge > 0 && <> · {tc('admin.manual.toMerge', toMerge)}</>}
      </p>
      {items.length === 0 ? (
        <p>{t('admin.manual.none')}</p>
      ) : (
        <div className="admin-user__grid">
          {items.map((item) => (
            <section
              key={item.id}
              className="card admin-user__section"
              aria-labelledby={`manual-${item.id}`}
            >
              <h2 id={`manual-${item.id}`}>
                <Link href={item.url}>
                  {kind === 'sets' ? displaySetNum(item.number) : item.number} {item.name}
                </Link>
              </h2>
              {item.duplicates.length > 0 && (
                <p className="admin-merge__alert">{t('admin.manual.duplicateFound')}</p>
              )}
              <p>
                <Link href={`/admin/catalogue/${kind}/${item.id}`}>
                  {t('admin.catalogue.adminLink')}
                </Link>
              </p>
              <MergeForm kind={kind} item={item} />
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  )
}

AdminManual.layout = [AppLayout]
