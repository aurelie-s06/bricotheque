/**
 * "Brico", the mascot of the site (an original drawing, not a LEGO
 * minifigure): a 1×2 brick head with two yellow studs, a 2×2 brick body
 * wearing the "B" of the logo, round hands. Line art in the colours of
 * the site.
 * Decorative: the text of the page says what it means.
 *
 * - lost: a question mark (page not found)
 * - empty: holds an empty box (empty collection, no result)
 * - key: holds a key (page reserved)
 * - broken: holds a cracked brick (server error)
 */
export type MascotVariant = 'lost' | 'empty' | 'key' | 'broken'

const INK = 'var(--ink)'
const YELLOW = 'var(--brick-yellow)'
const YELLOW_DARK = 'var(--brick-yellow-dark)'
const SURFACE = 'var(--surface)'

export default function Mascot({ variant, size = 140 }: { variant: MascotVariant; size?: number }) {
  const stroke = {
    stroke: INK,
    strokeWidth: 3,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  } as const
  // Arms forward to hold a box or a brick; otherwise one arm raised
  const holds = variant === 'empty' || variant === 'broken'

  return (
    <svg
      className="mascot"
      width={size}
      height={size}
      viewBox="0 0 160 170"
      aria-hidden="true"
      focusable="false"
    >
      {/* shadow */}
      <ellipse cx="80" cy="162" rx="44" ry="5" fill="var(--line)" />

      {/* legs */}
      <rect x="56" y="122" width="20" height="34" rx="5" fill={SURFACE} {...stroke} />
      <rect x="84" y="122" width="20" height="34" rx="5" fill={SURFACE} {...stroke} />

      {/* arms (behind the body) */}
      {holds ? (
        <>
          <path d="M48 84 L34 104" fill="none" {...stroke} strokeWidth={9} stroke={INK} />
          <path
            d="M48 84 L34 104"
            fill="none"
            stroke={YELLOW}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <path d="M112 84 L126 104" fill="none" {...stroke} strokeWidth={9} stroke={INK} />
          <path
            d="M112 84 L126 104"
            fill="none"
            stroke={YELLOW}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path d="M48 84 L38 112" fill="none" {...stroke} strokeWidth={9} stroke={INK} />
          <path
            d="M48 84 L38 112"
            fill="none"
            stroke={YELLOW}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          {/* scratching its head */}
          <path d="M112 84 L128 62" fill="none" {...stroke} strokeWidth={9} stroke={INK} />
          <path
            d="M112 84 L128 62"
            fill="none"
            stroke={YELLOW}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </>
      )}

      {/* body: a 2×2 brick with two studs */}
      <rect x="50" y="70" width="14" height="8" rx="2" fill={YELLOW} {...stroke} />
      <rect x="96" y="70" width="14" height="8" rx="2" fill={YELLOW} {...stroke} />
      <rect x="44" y="76" width="72" height="50" rx="7" fill={YELLOW} {...stroke} />
      <path d="M47 118 H113" stroke={YELLOW_DARK} strokeWidth={4} strokeLinecap="round" />
      {/* the "B" of the logo on its chest (hidden behind what it holds) */}
      {!holds && (
        <>
          <path d="M72 84 h10 a7 7 0 0 1 0 14 a7 7 0 0 1 0 14 h-10 z" fill={INK} />
          <circle cx="82" cy="91" r="2.6" fill={YELLOW} />
          <circle cx="82" cy="105" r="2.6" fill={YELLOW} />
        </>
      )}

      {/* head: a 1×2 brick with two yellow studs */}
      <rect x="58" y="8" width="16" height="10" rx="3" fill={YELLOW} {...stroke} />
      <rect x="86" y="8" width="16" height="10" rx="3" fill={YELLOW} {...stroke} />
      <rect x="52" y="16" width="56" height="50" rx="12" fill={SURFACE} {...stroke} />
      <circle cx="71" cy="38" r="3.5" fill={INK} />
      <circle cx="89" cy="38" r="3.5" fill={INK} />
      {variant === 'lost' && <ellipse cx="80" cy="52" rx="4" ry="5" fill="none" {...stroke} />}
      {variant === 'broken' && <path d="M72 53 Q80 48 88 53" fill="none" {...stroke} />}
      {(variant === 'empty' || variant === 'key') && (
        <path d="M71 50 Q80 58 89 50" fill="none" {...stroke} />
      )}

      {/* hands and what they hold */}
      {variant === 'lost' && (
        <>
          <circle cx="37" cy="114" r="7" fill={SURFACE} {...stroke} />
          <circle cx="129" cy="60" r="7" fill={SURFACE} {...stroke} />
          <text
            x="132"
            y="34"
            fontFamily="var(--font-display)"
            fontWeight="800"
            fontSize="34"
            fill={YELLOW_DARK}
            textAnchor="middle"
          >
            ?
          </text>
        </>
      )}

      {variant === 'empty' && (
        <>
          {/* an open, empty box */}
          <path d="M40 104 L120 104 L114 140 L46 140 Z" fill={SURFACE} {...stroke} />
          <path d="M40 104 L30 92 M120 104 L130 92" fill="none" {...stroke} />
          <path d="M54 116 H106" stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />
          <circle cx="36" cy="106" r="7" fill={SURFACE} {...stroke} />
          <circle cx="124" cy="106" r="7" fill={SURFACE} {...stroke} />
        </>
      )}

      {variant === 'key' && (
        <>
          <circle cx="37" cy="114" r="7" fill={SURFACE} {...stroke} />
          {/* a big key held up in the raised hand */}
          <circle
            cx="134"
            cy="22"
            r="11"
            fill={SURFACE}
            {...stroke}
            stroke={YELLOW_DARK}
            strokeWidth={4}
          />
          <circle cx="134" cy="22" r="3.5" fill={YELLOW_DARK} />
          <path
            d="M134 33 V58 M134 44 H142 M134 51 H140"
            fill="none"
            {...stroke}
            stroke={YELLOW_DARK}
            strokeWidth={4}
          />
          <circle cx="129" cy="60" r="7" fill={SURFACE} {...stroke} />
        </>
      )}

      {variant === 'broken' && (
        <>
          {/* a brick cracked in two */}
          <path d="M44 100 H78 L74 110 L80 118 L76 126 H44 Z" fill="var(--brick-red)" {...stroke} />
          <path d="M84 100 H116 V126 H82 L86 118 L80 110 Z" fill="var(--brick-red)" {...stroke} />
          <circle cx="36" cy="110" r="7" fill={SURFACE} {...stroke} />
          <circle cx="124" cy="110" r="7" fill={SURFACE} {...stroke} />
        </>
      )}
    </svg>
  )
}
