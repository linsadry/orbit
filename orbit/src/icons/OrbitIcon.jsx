// Premium geometric icon system for Orbit
// Each icon is a pure SVG path designed for 24x24 viewBox
// Optimized for small sizes (sidebar), medium (cards), and large (orbit header)
// 20 unique icons — all designed to the same aesthetic language:
//   asymmetric, minimal, geometric, slightly organic

export function OrbitIcon({ id, size = 24, color = 'currentColor', strokeWidth = 1.4 }) {
  const icons = {
    'orbit-rings': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.9" />
        <ellipse cx="12" cy="12" rx="7" ry="3.5"
          stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.7"
          transform="rotate(-20 12 12)" />
        <ellipse cx="12" cy="12" rx="10.5" ry="3"
          stroke={color} strokeWidth={strokeWidth * 0.7} fill="none" opacity="0.35"
          transform="rotate(30 12 12)" />
      </svg>
    ),
    'node-cluster': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="2" fill={color} opacity="0.9" />
        <circle cx="7" cy="15" r="1.5" fill={color} opacity="0.7" />
        <circle cx="17" cy="15" r="1.5" fill={color} opacity="0.7" />
        <circle cx="12" cy="17.5" r="1" fill={color} opacity="0.4" />
        <line x1="12" y1="10" x2="7" y2="13.5" stroke={color} strokeWidth={strokeWidth * 0.8} opacity="0.4" />
        <line x1="12" y1="10" x2="17" y2="13.5" stroke={color} strokeWidth={strokeWidth * 0.8} opacity="0.4" />
        <line x1="7" y1="16.5" x2="12" y2="16.5" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
        <line x1="17" y1="16.5" x2="12" y2="16.5" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
      </svg>
    ),
    'arc-open': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 17 A9 9 0 0 1 19 17" stroke={color} strokeWidth={strokeWidth * 1.5}
          strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M8 14 A5.5 5.5 0 0 1 16 14" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" fill="none" opacity="0.5" />
        <circle cx="12" cy="17" r="1.5" fill={color} opacity="0.6" />
      </svg>
    ),
    'constellation': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="8" r="1.2" fill={color} opacity="0.6" />
        <circle cx="14" cy="6" r="1.8" fill={color} opacity="0.9" />
        <circle cx="18" cy="13" r="1.2" fill={color} opacity="0.6" />
        <circle cx="10" cy="16" r="1" fill={color} opacity="0.45" />
        <circle cx="5" cy="17" r="0.8" fill={color} opacity="0.35" />
        <line x1="6" y1="8" x2="14" y2="6" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.3" />
        <line x1="14" y1="6" x2="18" y2="13" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.3" />
        <line x1="18" y1="13" x2="10" y2="16" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.3" />
        <line x1="10" y1="16" x2="5" y2="17" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.2" />
        <line x1="6" y1="8" x2="10" y2="16" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.2" />
      </svg>
    ),
    'wave-flow': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 12 C5.5 8, 8.5 8, 11 12 S16.5 16, 21 12"
          stroke={color} strokeWidth={strokeWidth * 1.4} strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M3 16 C5.5 12, 8.5 12, 11 16 S16.5 20, 21 16"
          stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" fill="none" opacity="0.35" />
      </svg>
    ),
    'helix': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 4 C14 4, 16 8, 12 10 S8 14, 14 16 S16 20, 12 20"
          stroke={color} strokeWidth={strokeWidth * 1.3} strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M16 4 C10 4, 8 8, 12 10 S16 14, 10 16 S8 20, 12 20"
          stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" fill="none" opacity="0.35" />
      </svg>
    ),
    'prism': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <polygon points="12,4 20,18 4,18" stroke={color} strokeWidth={strokeWidth * 1.2}
          fill="none" strokeLinejoin="round" opacity="0.9" />
        <line x1="12" y1="4" x2="12" y2="18" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
        <line x1="12" y1="11" x2="20" y2="18" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.2" />
      </svg>
    ),
    'lens': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7.5" stroke={color} strokeWidth={strokeWidth * 1.2} fill="none" opacity="0.9" />
        <path d="M12 4.5 Q17 12, 12 19.5" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" opacity="0.4" />
        <path d="M12 4.5 Q7 12, 12 19.5" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" opacity="0.25" />
      </svg>
    ),
    'delta': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 5 L20 19 L4 19 Z" stroke={color} strokeWidth={strokeWidth * 1.2}
          fill="none" strokeLinejoin="round" opacity="0.9" />
        <path d="M9.5 14 L14.5 14" stroke={color} strokeWidth={strokeWidth * 0.8} opacity="0.4" />
        <path d="M7.5 19 L12 11 L16.5 19" stroke={color} strokeWidth={strokeWidth * 0.5}
          fill="none" strokeLinejoin="round" opacity="0.2" />
      </svg>
    ),
    'radial': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" fill={color} opacity="0.9" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x1 = 12 + 3.5 * Math.cos(rad)
          const y1 = 12 + 3.5 * Math.sin(rad)
          const x2 = 12 + (i % 2 === 0 ? 8 : 6) * Math.cos(rad)
          const y2 = 12 + (i % 2 === 0 ? 8 : 6) * Math.sin(rad)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth={i % 2 === 0 ? strokeWidth * 0.9 : strokeWidth * 0.5}
            opacity={i % 2 === 0 ? 0.7 : 0.3} strokeLinecap="round" />
        })}
      </svg>
    ),
    'spiral': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 12 C12 10, 14 8, 16 10 S17 15, 14 17 S9 18, 7 15 S6 8, 9 6 S16 5, 19 8"
          stroke={color} strokeWidth={strokeWidth * 1.3} strokeLinecap="round" fill="none" opacity="0.9" />
      </svg>
    ),
    'diamond': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <polygon points="12,4 20,12 12,20 4,12" stroke={color} strokeWidth={strokeWidth * 1.2}
          fill="none" strokeLinejoin="round" opacity="0.9" />
        <polygon points="12,8 16,12 12,16 8,12" stroke={color} strokeWidth={strokeWidth * 0.7}
          fill="none" strokeLinejoin="round" opacity="0.4" />
        <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.2" />
        <line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.2" />
      </svg>
    ),

    // ── 8 additional premium icons ──────────────────────────────

    // Asymmetric loop — continuous learning, no end point
    'loop-open': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 17 C5 11, 9 6, 15 7 S22 13, 19 17 S13 21, 8 18"
          stroke={color} strokeWidth={strokeWidth * 1.3} strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="8" cy="18" r="1.5" fill={color} opacity="0.5" />
      </svg>
    ),

    // Layered rings — depth, strata, accumulated knowledge
    'strata': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="18" rx="8" ry="2.5" stroke={color} strokeWidth={strokeWidth * 1.1} fill="none" opacity="0.9" />
        <ellipse cx="12" cy="13" rx="6" ry="2" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.6" />
        <ellipse cx="12" cy="9" rx="4" ry="1.5" stroke={color} strokeWidth={strokeWidth * 0.85} fill="none" opacity="0.38" />
        <circle cx="12" cy="6" r="1" fill={color} opacity="0.25" />
      </svg>
    ),

    // Anchor — depth, commitment, stable base
    'anchor': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth={strokeWidth * 1.1} fill="none" opacity="0.9" />
        <line x1="12" y1="9.5" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth * 1.1} strokeLinecap="round" opacity="0.9" />
        <path d="M7 14 C7 18, 17 18, 17 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" opacity="0.5" />
        <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" opacity="0.4" />
      </svg>
    ),

    // Meridian — precision, navigation, the globe meridian as focus
    'meridian': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth * 1.1} fill="none" opacity="0.8" />
        <ellipse cx="12" cy="12" rx="5" ry="8.5" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" opacity="0.4" />
        <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth={strokeWidth * 0.65} opacity="0.3" />
      </svg>
    ),

    // Branch — ramifications, organic growth of knowledge
    'branch': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="20" x2="12" y2="10" stroke={color} strokeWidth={strokeWidth * 1.3} strokeLinecap="round" opacity="0.9" />
        <line x1="12" y1="10" x2="7" y2="5" stroke={color} strokeWidth={strokeWidth * 1.1} strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="10" x2="17" y2="5" stroke={color} strokeWidth={strokeWidth * 1.1} strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="15" x2="8" y2="12" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" opacity="0.4" />
        <line x1="12" y1="13" x2="16.5" y2="10.5" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" opacity="0.35" />
        <circle cx="7" cy="5" r="1.2" fill={color} opacity="0.6" />
        <circle cx="17" cy="5" r="1.2" fill={color} opacity="0.6" />
        <circle cx="8" cy="12" r="0.9" fill={color} opacity="0.38" />
        <circle cx="16.5" cy="10.5" r="0.9" fill={color} opacity="0.35" />
      </svg>
    ),

    // Compass — direction, north star, strategic navigation
    'compass': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth * 1.1} fill="none" opacity="0.75" />
        <polygon points="12,5 13.5,12 12,13.5 10.5,12"
          fill={color} opacity="0.9" />
        <polygon points="12,19 13.5,12 12,10.5 10.5,12"
          fill={color} opacity="0.28" />
        <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.6" />
      </svg>
    ),

    // Grid-break — structured disruption, thinking outside the system
    'grid-break': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.8" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.8" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.8" />
        <path d="M13.5 13.5 L20 20 M13.5 20 L20 13.5"
          stroke={color} strokeWidth={strokeWidth * 1.1} strokeLinecap="round" opacity="0.6" />
      </svg>
    ),

    // Parallax — depth layers, multiple simultaneous planes of study
    'parallax': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="10" rx="2" stroke={color} strokeWidth={strokeWidth * 1.1} fill="none" opacity="0.85" />
        <rect x="6" y="4.5" width="12" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth * 0.8} fill="none" opacity="0.45" />
        <rect x="9" y="2.5" width="6" height="4.5" rx="1" stroke={color} strokeWidth={strokeWidth * 0.6} fill="none" opacity="0.22" />
      </svg>
    ),
  }

  return icons[id] || icons['orbit-rings']
}

// Standalone app icon for splash/header (48x48)
export function OrbitAppIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="4" fill="#b5813a" opacity="0.95" />
      <ellipse cx="24" cy="24" rx="14" ry="5.5"
        stroke="#b5813a" strokeWidth="1.6" fill="none" opacity="0.65"
        transform="rotate(-18 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="4.5"
        stroke="#b5813a" strokeWidth="1" fill="none" opacity="0.28"
        transform="rotate(28 24 24)" />
      <circle cx="24" cy="10.5" r="1.8" fill="#b5813a" opacity="0.5" />
    </svg>
  )
}
