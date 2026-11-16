const appName = 'Briquothèque'

/**
 * Builds the document title, shared by the browser and SSR entrypoints.
 */
export function pageTitle(title?: string) {
  return title ? `${title} – ${appName}` : `${appName} – Catalogue de sets et minifigs`
}
