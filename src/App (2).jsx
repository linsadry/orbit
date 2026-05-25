import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import OrbitasPage from './pages/OrbitasPage.jsx'
import CicloPage from './pages/CicloPage.jsx'
import RevisoesPage from './pages/RevisoesPage.jsx'
import MapaPage from './pages/MapaPage.jsx'
import MetricasPage from './pages/MetricasPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import { fetchAllData } from './lib/db.js'
import { buildCycle } from './lib/cycleEngine.js'
import { DEMO_MODE } from './lib/supabase.js'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({ orbits: [], topics: [], sessions: [], reviews: [] })
  const [cycle, setCycle] = useState([])
  const [completedIds, setCompletedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  const loadData = useCallback(async () => {
    const result = await fetchAllData()
    setData(result)
    const newCycle = buildCycle({
      orbits: result.orbits,
      topics: result.topics,
      sessions: result.sessions,
      reviews: result.reviews,
      config: { dailyMinutes: 120 }
    })
    setCycle(newCycle)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const notify = useCallback((msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }, [])

  const completeItem = useCallback((id) => {
    setCompletedIds(prev => [...prev, id])
  }, [])

  const refreshData = useCallback(() => {
    loadData()
  }, [loadData])

  const pages = {
    dashboard: <Dashboard data={data} cycle={cycle} completedIds={completedIds} onNavigate={setPage} notify={notify} />,
    orbitas: <OrbitasPage data={data} onNavigate={setPage} notify={notify} onRefresh={refreshData} />,
    ciclo: <CicloPage data={data} cycle={cycle} completedIds={completedIds} onComplete={completeItem} notify={notify} onRefresh={refreshData} />,
    revisoes: <RevisoesPage data={data} notify={notify} onRefresh={refreshData} />,
    mapa: <MapaPage data={data} />,
    metricas: <MetricasPage data={data} sessions={data.sessions} />,
    importar: <ImportPage data={data} notify={notify} onRefresh={refreshData} onNavigate={setPage} />,
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingInner}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="4" fill="#b5813a" />
            <ellipse cx="24" cy="24" rx="14" ry="5.5" stroke="#b5813a" strokeWidth="1.6" fill="none" opacity="0.65" transform="rotate(-18 24 24)" />
            <ellipse cx="24" cy="24" rx="20" ry="4.5" stroke="#b5813a" strokeWidth="1" fill="none" opacity="0.28" transform="rotate(28 24 24)" />
          </svg>
          <div style={styles.loadingText}>Orbit</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <Sidebar activePage={page} onNavigate={setPage} data={data} demoMode={DEMO_MODE} />
      <main style={styles.main}>
        {pages[page] || pages.dashboard}
      </main>
      {notification && (
        <div style={{ ...styles.notification, background: notification.type === 'error' ? '#3a1a1a' : '#1a2a1a' }}>
          <span style={{ color: notification.type === 'error' ? '#c47a5a' : '#7aab6e', fontSize: 14 }}>
            {notification.type === 'error' ? '○' : '●'}
          </span>
          {notification.msg}
        </div>
      )}
    </div>
  )
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    background: '#0d0d0b',
    color: '#e2ddd4',
    fontFamily: "'Geist', system-ui, sans-serif",
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0d0d0b',
  },
  loadingInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 22,
    color: '#b5813a',
    letterSpacing: 1,
  },
  notification: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    padding: '12px 18px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: 13,
    color: '#e2ddd4',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
    animation: 'slideUp 0.2s ease',
  },
}
