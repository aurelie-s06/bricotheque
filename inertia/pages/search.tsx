import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import { type InertiaProps } from '~/types'

export default function Search({ q }: InertiaProps<{ q: string }>) {
  return (
    <>
      <Seo title={q ? `Recherche « ${q} »` : 'Recherche'} />

      <h1>Recherche</h1>
      <div className="empty-state" style={{ marginTop: 'var(--space-3)' }}>
        <div className="studs" aria-hidden="true" />
        {q && <p>{`Tu as cherché « ${q} ».`}</p>}
        <p className="text-muted">La recherche sera disponible quand le catalogue sera importé.</p>
      </div>
    </>
  )
}

Search.layout = [AppLayout]
