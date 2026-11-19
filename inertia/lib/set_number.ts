/**
 * Set number as people know it: "75192-1" → "75192". The "-1" suffix of
 * the first version is hidden; other versions keep theirs ("75192-2") so
 * they stay distinct. URLs and exports keep the full number. Sets added
 * by hand carry a "~m" suffix, hidden too.
 */
export function displaySetNum(setNum: string) {
  return setNum.replace(/~m$/, '').replace(/-1$/, '')
}
