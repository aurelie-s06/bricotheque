import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import ImageUrlForm, { type AdminImageItem } from '~/components/image_url_form'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{ item: AdminImageItem }>

export default function AdminImageEdit({ item }: Props) {
  const { t } = useI18n()
  return (
    <AdminShell title={t('admin.image.editTitle')}>
      {item.importedUrl && (
        <p className="text-muted">
          {t('admin.image.imported')} <code>{item.importedUrl}</code>
        </p>
      )}
      <p className="text-muted">{t('admin.image.clearHint')}</p>
      <ImageUrlForm item={item} />
    </AdminShell>
  )
}

AdminImageEdit.layout = [AppLayout]
