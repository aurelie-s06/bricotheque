import { Head } from '@inertiajs/react'

export const DEFAULT_DESCRIPTION =
  'Briquothèque : le catalogue de tous les sets et minifigs de briques, pour gérer ta collection et ta wishlist.'

/**
 * Page <title> and meta description. The site name is appended to the
 * title by the Inertia app (see inertia/app.tsx).
 */
export default function Seo({ title, description }: { title?: string; description?: string }) {
  return (
    <Head title={title}>
      <meta
        // Inertia uses head-key to deduplicate tags between pages
        // eslint-disable-next-line react/no-unknown-property
        head-key="description"
        name="description"
        content={description ?? DEFAULT_DESCRIPTION}
      />
    </Head>
  )
}
