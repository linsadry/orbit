import { computeOrbitStats, weeklyConsistency } from '../lib/cycleEngine.js'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'

export default function Dashboard({ data, cycle, completedIds, onNavigate, notify }) {
  const { orbits = [], topics = [], sessions = [], reviews = [] } = data
  const today = new Date()
  const todayStr = today.toDateString()

  const todaySecs = sessions
    .filter(s => new Date(s.created_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + (s.duration_sec || 0), 0)
  const todayMin = Math.floor(todaySecs / 60)

  const overdueReviews = reviews.filter(r => new Date(r.due_at) <= today)
  const pendingCycle = cycle.filter(c => !completedIds.includes(c.id))
  const nextItem = pendingCycle[0]

  const weekData = weeklyConsistency(sessions)
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const todayIdx = today.getDay()

  const totalTopics = topics.length
  const doneTopics = topics.filter(t => t.status === 'done').length

  return (
    <div>
      {/* Topbar */}
      <div style={s.topbar}>
        <div>
          <div style={s.greeting}>
            {getGreeting()}, Adriana
          </div>
          <div style={s.date}>{formatDate(today)}</div>
        </div>
        <div style={s.topbarRight}>
          {nextItem && (
            <button style={s.btnPrimary} onClick={() => onNavigate('ciclo')}>
              ▶ Iniciar sessão
            </button>
          )}
        </div>
      </div>

      <div style={s.content}>
        {/* Continue card */}
        {nextItem && (
          <div style={s.continueCard}>
            <div style={s.continueDot} />
            <div style={s.continueInfo}>
              <div style={s.continueTitle}>
                {nextItem.type === 'review' ? 'Revisão pendente' : 'Continue de onde parou'}
              </div>
              <div style={s.continueSub}>
                {nextItem.title} · {nextItem.orbitName} · {nextItem.estimatedMinutes}min
              </div>
            </div>
            <button style={s.btnPrimary} onClick={() => onNavigate('ciclo')}>
              Retomar →
            </button>
          </div>
        )}

        {/* Stats row */}
        <div style={s.statsRow}>
          <StatCard label="Hoje" value={`${todayMin}min`} sub="meta: 2h" accent />
          <StatCard label="Revisões" value={overdueReviews.length} sub="pendentes" warn={overdueReviews.length > 0} />
          <StatCard label="Tópicos" value={doneTopics} sub={`de ${totalTopics} totais`} />
          <StatCard label="Sessão atual" value={pendingCycle.length} sub="itens no ciclo" />
        </div>

        {/* Orbits + Reviews */}
        <div style={s.twoCol}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <span style={s.panelTitle}>Órbitas ativas</span>
              <button style={s.panelAction} onClick={() => onNavigate('orbitas')}>ver todas</button>
            </div>
            <div style={s.panelBody}>
              {orbits.map(orbit => {
                const stats = computeOrbitStats(orbit.id, topics, sessions)
                return (
                  <div key={orbit.id} style={s.orbitRow} onClick={() => onNavigate('orbitas')}>
                    <OrbitIcon id={orbit.icon} size={18} color={orbit.color} />
                    <div style={s.orbitRowInfo}>
                      <div style={s.orbitRowName}>{orbit.name}</div>
                      <div style={s.orbitRowMeta}>{stats.totalTopics} tópicos · {stats.totalHours}h</div>
                    </div>
                    <div style={s.orbitRowRight}>
                      <span style={s.orbitRowPct}>{stats.pct}%</span>
                      <div style={s.progressBarWrap}>
                        <div style={{ ...s.progressBarFill, width: `${stats.pct}%`, background: orbit.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelHeader}>
              <span style={s.panelTitle}>Revisões</span>
              <button style={s.panelAction} onClick={() => onNavigate('revisoes')}>ver todas</button>
            </div>
            <div style={s.panelBody}>
              {overdueReviews.slice(0, 5).map(r => {
                const topic = data.topics.find(t => t.id === r.topic_id)
                const orbit = data.orbits.find(o => o.id === r.orbit_id)
                return (
                  <div key={r.id} style={s.reviewRow} onClick={() => onNavigate('revisoes')}>
                    <div style={{ ...s.reviewDot, background: orbit?.color || '#888' }} />
                    <div style={s.reviewInfo}>
                      <div style={s.reviewTopic}>{topic?.title || 'Revisão'}</div>
                      <div style={s.reviewOrbit}>{orbit?.name}</div>
                    </div>
                    <span style={s.reviewTag}>hoje</span>
                  </div>
                )
              })}
              {overdueReviews.length === 0 && (
                <div style={s.emptyState}>Nenhuma revisão pendente</div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly consistency */}
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <span style={s.panelTitle}>Consistência semanal</span>
          </div>
          <div style={{ ...s.panelBody, padding: '20px 24px' }}>
            <div style={s.weekGrid}>
              {weekDayLabels.map((label, i) => {
                const hours = weekData[i] || 0
                const intensity = Math.min(4, Math.ceil(hours * 1.5))
                const isToday = i === todayIdx
                return (
                  <div key={i} style={s.weekCol}>
                    <div style={{ ...s.weekBar, opacity: isToday ? 1 : 0.7 }}>
                      <div style={{
                        ...s.weekFill,
                        height: `${Math.min(100, hours * 25)}%`,
                        background: intensity === 0 ? 'rgba(255,255,255,0.05)'
                          : `rgba(181,129,58,${0.2 + intensity * 0.18})`,
                        borderBottom: isToday ? '2px solid #b5813a' : 'none',
                      }} />
                    </div>
                    <div style={{ ...s.weekLabel, color: isToday ? '#b5813a' : '#4e4a42' }}>{label}</div>
                    {hours > 0 && <div style={s.weekHours}>{hours.toFixed(1)}h</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, warn }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{
        ...s.statValue,
        color: accent ? '#b5813a' : warn ? '#c47a5a' : '#e2ddd4'
      }}>{value}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const C = {
  bg2: '#131310', bg3: '#1a1a16', bg4: '#202019',
  border: 'rgba(255,255,255,0.055)',
  text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42',
  accent: '#b5813a',
}

const s = {
  topbar: {
    padding: '20px 32px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    background: '#0d0d0b',
    zIndex: 10,
  },
  greeting: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 22,
    color: C.text,
    fontWeight: 400,
  },
  date: { fontSize: 12, color: C.text3, marginTop: 2 },
  topbarRight: { display: 'flex', gap: 10 },
  btnPrimary: {
    padding: '8px 16px',
    background: 'rgba(181,129,58,0.15)',
    border: '1px solid rgba(181,129,58,0.35)',
    borderRadius: 8,
    color: C.accent,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Geist', system-ui, sans-serif",
  },
  content: { padding: '28px 32px' },
  continueCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: 'rgba(181,129,58,0.06)',
    border: '1px solid rgba(181,129,58,0.15)',
    borderRadius: 12,
    marginBottom: 24,
  },
  continueDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: C.accent,
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(181,129,58,0.5)',
  },
  continueInfo: { flex: 1 },
  continueTitle: { fontSize: 13.5, fontWeight: 500, color: C.text },
  continueSub: { fontSize: 12, color: C.text3, marginTop: 2 },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '18px 20px',
  },
  statLabel: { fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  statValue: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 28,
    lineHeight: 1,
    marginBottom: 4,
  },
  statSub: { fontSize: 11, color: C.text3 },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 16,
    marginBottom: 24,
  },
  panel: {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '14px 20px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: { fontSize: 13, fontWeight: 500, color: C.text },
  panelAction: {
    fontSize: 12,
    color: C.accent,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Geist', system-ui, sans-serif",
  },
  panelBody: { padding: '8px 12px' },
  orbitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.13s',
  },
  orbitRowInfo: { flex: 1 },
  orbitRowName: { fontSize: 13, fontWeight: 500, color: C.text },
  orbitRowMeta: { fontSize: 11, color: C.text3, marginTop: 1 },
  orbitRowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 },
  orbitRowPct: { fontSize: 12, color: C.text2 },
  progressBarWrap: { width: 64, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 99 },
  progressBarFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  reviewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  reviewDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  reviewInfo: { flex: 1 },
  reviewTopic: { fontSize: 12.5, color: C.text },
  reviewOrbit: { fontSize: 11, color: C.text3 },
  reviewTag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 99,
    border: '1px solid rgba(196,122,90,0.3)',
    color: '#c47a5a',
    background: 'rgba(196,122,90,0.07)',
  },
  emptyState: { padding: '20px 10px', fontSize: 12, color: C.text3, textAlign: 'center' },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 8,
    height: 100,
  },
  weekCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  weekBar: {
    flex: 1,
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  weekFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
    transition: 'height 0.4s ease',
  },
  weekLabel: { fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  weekHours: { fontSize: 9, color: '#4e4a42' },
}
