/**
 * Document title, shared by the browser and SSR entrypoints. The <Seo>
 * component already builds the full, translated title.
 */
export function pageTitle(title?: string) {
  return title || 'Bricothèque'
}
