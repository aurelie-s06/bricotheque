import { Head } from '@inertiajs/react'
import { useI18n } from '~/i18n'

/**
 * Page <title> ("… – Bricothèque") and meta description, in the visitor's language.
 */
export default function Seo({ title, description }: { title?: string; description?: string }) {
  const { t } = useI18n()
  return (
    <Head title={title ? `${title} – Bricothèque` : t('site.defaultTitle')}>
      <meta
        // Inertia uses head-key to deduplicate tags between pages
        // eslint-disable-next-line react/no-unknown-property
        head-key="description"
        name="description"
        content={description ?? t('site.defaultDescription')}
      />
    </Head>
  )
}
