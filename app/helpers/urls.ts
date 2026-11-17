/**
 * Public URLs of the catalogue, built in one place so the links and the
 * route lookups always agree.
 *
 * Sets: /sets/75192-1-millennium-falcon (set number + slug)
 */
export function setPath(set: { setNum: string; slug: string }) {
  return `/sets/${set.setNum.toLowerCase()}-${set.slug}`
}

export function minifigPath(minifig: { figNum: string; slug: string }) {
  return `/minifigs/${minifig.figNum.toLowerCase()}-${minifig.slug}`
}

export function themePath(theme: { slug: string }) {
  return `/themes/${theme.slug}`
}

/**
 * Candidate set numbers for a "/sets/:ref" parameter. Set numbers can
 * contain dashes ("WIZARD-CARDS-1"), so every prefix is a candidate:
 * "75192-1-millennium-falcon" → ["75192", "75192-1", "75192-1-millennium", …]
 */
export function setNumCandidates(ref: string) {
  const parts = ref.split('-')
  return parts.map((_, index) => parts.slice(0, index + 1).join('-'))
}

export function rebrickableSetUrl(setNum: string) {
  return `https://rebrickable.com/sets/${encodeURIComponent(setNum)}/`
}

export function bricksetSetUrl(setNum: string) {
  return `https://brickset.com/sets/${encodeURIComponent(setNum)}`
}
