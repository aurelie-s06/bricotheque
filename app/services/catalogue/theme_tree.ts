import db from '@adonisjs/lucid/services/db'

export type ThemeNode = {
  id: number
  name: string
  slug: string
  parentId: number | null
}

/**
 * The themes hierarchy (about 500 rows), loaded once per request to find
 * descendants (filters "with subthemes"), ancestors (breadcrumbs) and set
 * counts per theme.
 */
export default class ThemeTree {
  readonly byId: Map<number, ThemeNode>
  readonly bySlug: Map<string, ThemeNode>
  readonly children: Map<number | null, ThemeNode[]>

  constructor(themes: ThemeNode[]) {
    const sorted = [...themes].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    this.byId = new Map(sorted.map((theme) => [theme.id, theme]))
    this.bySlug = new Map(sorted.map((theme) => [theme.slug, theme]))
    this.children = new Map()
    for (const theme of sorted) {
      const parentId =
        theme.parentId !== null && this.byId.has(theme.parentId) ? theme.parentId : null
      const siblings = this.children.get(parentId) ?? []
      siblings.push(theme)
      this.children.set(parentId, siblings)
    }
  }

  static async load() {
    const rows: { id: number; name: string; slug: string; parent_id: number | null }[] = await db
      .from('themes')
      .select('id', 'name', 'slug', 'parent_id')
    return new ThemeTree(
      rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, parentId: row.parent_id }))
    )
  }

  roots() {
    return this.children.get(null) ?? []
  }

  childrenOf(id: number) {
    return this.children.get(id) ?? []
  }

  /** The theme and all its subthemes, at any depth */
  descendantIds(id: number): number[] {
    const ids = [id]
    for (const child of this.childrenOf(id)) {
      ids.push(...this.descendantIds(child.id))
    }
    return ids
  }

  /** From the root down to the theme itself */
  ancestorsOf(id: number): ThemeNode[] {
    const chain: ThemeNode[] = []
    const seen = new Set<number>()
    let current = this.byId.get(id)
    while (current && !seen.has(current.id)) {
      seen.add(current.id)
      chain.unshift(current)
      current = current.parentId === null ? undefined : this.byId.get(current.parentId)
    }
    return chain
  }

  /**
   * Number of real sets (kind "set") per theme, subthemes included.
   */
  async setCounts(): Promise<Map<number, number>> {
    const rows: { theme_id: number; total: number }[] = await db
      .from('sets')
      .where('kind', 'set')
      .groupBy('theme_id')
      .select('theme_id')
      .count('* as total')

    const direct = new Map(rows.map((row) => [row.theme_id, Number(row.total)]))
    const totals = new Map<number, number>()
    const total = (id: number): number => {
      const cached = totals.get(id)
      if (cached !== undefined) {
        return cached
      }
      let sum = direct.get(id) ?? 0
      for (const child of this.childrenOf(id)) {
        sum += total(child.id)
      }
      totals.set(id, sum)
      return sum
    }
    for (const id of this.byId.keys()) {
      total(id)
    }
    return totals
  }

  /**
   * Number of minifigs per main theme (subthemes included).
   */
  async minifigCounts(): Promise<Map<number, number>> {
    const rows: { main_theme_id: number; total: number }[] = await db
      .from('minifigs')
      .whereNotNull('main_theme_id')
      .groupBy('main_theme_id')
      .select('main_theme_id')
      .count('* as total')
    return this.#sumUp(new Map(rows.map((row) => [row.main_theme_id, Number(row.total)])))
  }

  /** Adds the counts of the subthemes to their parents */
  #sumUp(direct: Map<number, number>) {
    const totals = new Map<number, number>()
    const total = (id: number): number => {
      const cached = totals.get(id)
      if (cached !== undefined) return cached
      let sum = direct.get(id) ?? 0
      for (const child of this.childrenOf(id)) sum += total(child.id)
      totals.set(id, sum)
      return sum
    }
    for (const id of this.byId.keys()) total(id)
    return totals
  }

  /**
   * Flat list for a <select>: roots then their subthemes, indented.
   * Only themes that have real sets are listed.
   */
  options(counts: Map<number, number>) {
    const options: { slug: string; name: string; depth: number }[] = []
    const walk = (nodes: ThemeNode[], depth: number) => {
      for (const node of nodes) {
        if ((counts.get(node.id) ?? 0) === 0) {
          continue
        }
        options.push({ slug: node.slug, name: node.name, depth })
        walk(this.childrenOf(node.id), depth + 1)
      }
    }
    walk(this.roots(), 0)
    return options
  }
}
