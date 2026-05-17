import { OrbitIcon, OrbitAppIcon } from '../icons/OrbitIcon.jsx'
import { computeOrbitStats } from '../lib/cycleEngine.js'

export default function Sidebar({ activePage, onNavigate, data, demoMode }) {
  const { orbits = [], topics = [], sessions = [], reviews = [] } = data
  const overdueCount = reviews.filter(r => new Date(r.due_at) <= new Date()).length

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: NavDashIcon },
    { id: 'ciclo', label: 'Ciclo de estudos', icon: NavCicloIcon },
    { id: 'revisoes', label: 'Revisões', icon: NavRevisaoIcon, badge: overdueCount || null },
    { id: 'mapa', label: 'Mapa visual', icon: NavMapaIcon },
    { id: 'metricas', label: 'Métricas', icon: NavMetricasIcon },
    { id: 'importar', label: 'Importar PDF', icon: NavImportIcon },
  ]

  return (
    <nav style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <OrbitAppIcon size={36} />
        <div>
          <div style={styles.logoName}>Orbit</div>
          <div style={styles.logoSub}>Sistema de aprendizagem</div>
        </div>
      </div>

      {demoMode && (
        <div style={styles.demoBadge}>
          Modo demonstração
        </div>
      )}

      {/* Main nav */}
      <div style={styles.navSection}>
        <div style={styles.navLabel}>Principal</div>
        {navItems.map(item => (
          <NavItem key={item.id} {...item} active={activePage === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </div>

      {/* Orbits */}
      <div style={{ ...styles.navSection, flex: 1 }}>
        <div style={styles.navLabel}>Minhas órbitas</div>
        {orbits.map(orbit => {
          const stats = computeOrbitStats(orbit.id, topics, sessions)
          return (
            <button
              key={orbit.id}
              style={{ ...styles.orbitNav, ...(activePage === `orbit-${orbit.id}` ? styles.navActive : {}) }}
              onClick={() => onNavigate('orbitas')}
            >
              <OrbitIcon id={orbit.icon} size={16} color={orbit.color} strokeWidth={1.5} />
              <span style={styles.orbitNavName}>{orbit.name}</span>
              <span style={styles.orbitNavPct}>{stats.pct}%</span>
            </button>
          )
        })}
        <button
          style={styles.addOrbitBtn}
          onClick={() => onNavigate('orbitas')}
        >
          <span style={styles.addOrbitPlus}>+</span>
          Nova órbita
        </button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <StreakWidget sessions={sessions} />
      </div>
    </nav>
  )
}

function NavItem({ id, label, icon: Icon, badge, active, onClick }) {
  return (
    <button style={{ ...styles.navItem, ...(active ? styles.navActive : {}) }} onClick={onClick}>
      <Icon active={active} />
      <span style={styles.navLabel2}>{label}</span>
      {badge ? <span style={styles.badge}>{badge}</span> : null}
    </button>
  )
}

function StreakWidget({ sessions }) {
  const today = new Date().toDateString()
  const todaySecs = sessions
    .filter(s => new Date(s.created_at).toDateString() === today)
    .reduce((sum, s) => sum + (s.duration_sec || 0), 0)
  const todayMin = Math.floor(todaySecs / 60)

  // Compute streak
  let streak = 0
  const sorted = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const studied = new Set(sorted.map(s => new Date(s.created_at).toDateString()))
  let d = new Date()
  while (studied.has(d.toDateString())) {
    streak++
    d.setDate(d.getDate() - 1)
  }

  return (
    <div style={styles.streak}>
      <div style={styles.streakNum}>{streak}</div>
      <div>
        <div style={styles.streakLabel}>dias seguidos</div>
        <div style={styles.streakSub}>{todayMin}min hoje</div>
      </div>
    </div>
  )
}

// Minimal geometric nav icons
const navIconStyle = (active) => ({
  width: 16,
  height: 16,
  opacity: active ? 1 : 0.55,
  flexShrink: 0,
})

function NavDashIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function NavCicloIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 1l2.5 2L8 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavRevisaoIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function NavMapaIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="11" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="11" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="6.5" x2="4" y2="9.8" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="8" y1="6.5" x2="12" y2="9.8" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    </svg>
  )
}

function NavMetricasIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <polyline points="1.5,12 5,7 8,9.5 11.5,4 14.5,5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavImportIcon({ active }) {
  return (
    <svg style={navIconStyle(active)} viewBox="0 0 16 16" fill="none">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 9v4M6 11l2 2 2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const C = {
  bg2: '#131310',
  border: 'rgba(255,255,255,0.055)',
  text: '#e2ddd4',
  text2: '#9e9a8e',
  text3: '#4e4a42',
  accent: '#b5813a',
}

const styles = {
  sidebar: {
    width: 220,
    minWidth: 220,
    background: C.bg2,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    gap: 0,
    height: '100vh',
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 18px 18px',
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 12,
  },
  logoName: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 19,
    color: C.accent,
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10,
    color: C.text3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  demoBadge: {
    margin: '0 14px 10px',
    padding: '5px 10px',
    background: 'rgba(181,129,58,0.1)',
    border: '1px solid rgba(181,129,58,0.2)',
    borderRadius: 6,
    fontSize: 10.5,
    color: C.accent,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  navSection: {
    padding: '0 10px',
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 10,
    color: C.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    padding: '0 8px',
    marginBottom: 4,
    marginTop: 10,
  },
  navLabel2: {
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    color: C.text2,
    border: 'none',
    background: 'none',
    width: '100%',
    fontFamily: "'Geist', system-ui, sans-serif",
    fontWeight: 400,
    transition: 'all 0.13s',
  },
  navActive: {
    background: 'rgba(255,255,255,0.05)',
    color: C.text,
  },
  badge: {
    background: 'rgba(196,122,90,0.2)',
    color: '#c47a5a',
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 99,
    border: '1px solid rgba(196,122,90,0.3)',
  },
  orbitNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    color: C.text2,
    border: 'none',
    background: 'none',
    width: '100%',
    fontFamily: "'Geist', system-ui, sans-serif",
    fontSize: 12.5,
    transition: 'all 0.13s',
  },
  orbitNavName: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12.5,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  orbitNavPct: {
    fontSize: 11,
    color: C.text3,
    flexShrink: 0,
  },
  addOrbitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    color: C.text3,
    border: `1px dashed ${C.border}`,
    background: 'none',
    width: '100%',
    fontFamily: "'Geist', system-ui, sans-serif",
    fontSize: 12.5,
    marginTop: 6,
    transition: 'all 0.13s',
  },
  addOrbitPlus: {
    fontSize: 16,
    lineHeight: 1,
    color: C.text3,
  },
  footer: {
    padding: '14px 18px',
    borderTop: `1px solid ${C.border}`,
    marginTop: 'auto',
  },
  streak: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  streakNum: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 28,
    color: C.accent,
    lineHeight: 1,
  },
  streakLabel: {
    fontSize: 11,
    color: C.text2,
  },
  streakSub: {
    fontSize: 10,
    color: C.text3,
    marginTop: 2,
  },
}
