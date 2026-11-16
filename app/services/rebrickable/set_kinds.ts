/**
 * Rebrickable lists some products that are not building sets. They are
 * grouped under a few root themes, which we map to a `kind`. Every theme
 * nested under one of these roots inherits its kind.
 *
 * Ids checked against themes.csv on 2026-11-16 (names are only used to warn
 * if Rebrickable ever renumbers them).
 */
export type SetKind = 'set' | 'book' | 'gear' | 'parts' | 'bundle'

export const KIND_BY_ROOT_THEME: Record<number, { name: string; kind: SetKind }> = {
  497: { name: 'Books', kind: 'book' },
  501: { name: 'Gear', kind: 'gear' },
  443: { name: 'Service Packs', kind: 'parts' },
  254: { name: 'Bulk Bricks', kind: 'parts' },
  559: { name: 'Value Packs', kind: 'bundle' },
}

/**
 * Builds a `themeId → root theme id` lookup from the themes tree.
 */
export function buildRootResolver(themes: { id: number; parentId: number | null }[]) {
  const parents = new Map(themes.map((theme) => [theme.id, theme.parentId]))
  const cache = new Map<number, number>()

  return (themeId: number): number => {
    const cached = cache.get(themeId)
    if (cached !== undefined) {
      return cached
    }

    let current: number | null | undefined = themeId
    let root = themeId
    const seen = new Set<number>()
    while (current !== null && current !== undefined && !seen.has(current)) {
      seen.add(current)
      root = current
      current = parents.get(current)
    }

    cache.set(themeId, root)
    return root
  }
}

/**
 * Builds a `themeId → kind` lookup from the themes tree.
 */
export function buildKindResolver(themes: { id: number; parentId: number | null }[]) {
  const rootOf = buildRootResolver(themes)
  return (themeId: number): SetKind => KIND_BY_ROOT_THEME[rootOf(themeId)]?.kind ?? 'set'
}
