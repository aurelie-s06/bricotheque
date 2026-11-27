import { useState } from 'react'
import SetImage, { thumbnailOf } from '~/components/set_image'
import { useI18n } from '~/i18n'

export type GalleryImage = { url: string; thumbnailUrl: string | null }

/**
 * Main picture of a set page, and its additional pictures (Brickset) as a
 * row of thumbnails: choosing one shows it in the main frame. Without
 * additional pictures, only the main picture, as before.
 */
export default function SetGallery({
  setId,
  imgUrl,
  gallery,
  alt,
}: {
  setId: number
  imgUrl: string | null
  gallery: GalleryImage[]
  /** Text of the main picture; the others get "photo n of …" */
  alt: string
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState(0)

  const pictures = [
    { url: imgUrl, thumbnailUrl: thumbnailOf(imgUrl) },
    ...gallery.map((image) => ({ url: image.url, thumbnailUrl: image.thumbnailUrl })),
  ]
  const total = pictures.length

  if (gallery.length === 0) {
    return (
      <div className="set-detail__media">
        <SetImage src={imgUrl} alt={alt} eager item={{ kind: 'sets', id: setId }} />
      </div>
    )
  }

  const current = pictures[selected] ?? pictures[0]
  const currentAlt =
    selected === 0 ? alt : t('set.photoAlt', { name: alt, number: selected + 1, total })

  return (
    <div className="set-detail__media set-detail__media--gallery">
      <div className="set-gallery__main">
        {/* key: a new picture starts again from its own loading state */}
        <SetImage
          key={current.url ?? 'none'}
          src={current.url}
          alt={currentAlt}
          eager
          item={selected === 0 ? { kind: 'sets', id: setId } : undefined}
        />
      </div>

      <ul className="set-gallery__thumbs" aria-label={t('set.photos', { count: total })}>
        {pictures.map((picture, index) => (
          <li key={`${index}-${picture.url}`}>
            <button
              type="button"
              className="set-gallery__thumb"
              aria-pressed={index === selected}
              aria-label={t('set.photoShow', { number: index + 1, total })}
              onClick={() => setSelected(index)}
            >
              <img
                src={picture.thumbnailUrl ?? picture.url ?? '/images/placeholder-set.svg'}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          </li>
        ))}
      </ul>
      <p className="set-gallery__credit">{t('set.photosCredit')}</p>
    </div>
  )
}
