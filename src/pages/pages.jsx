// OrbitasPage.jsx
import { useState } from 'react'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'
import { ORBIT_ICONS } from '../lib/demo.js'
import { createOrbit, updateTopic } from '../lib/db.js'
import { computeOrbitStats } from '../lib/cycleEngine.js'

export function OrbitasPage({ data, onNavigate, notify, onRefresh }) {
  const { orbits = [], topics = [], sessions = [] } = data
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('#b5813a')
  const [newIcon, setNewIcon] = useState('orbit-rings')
  const [newPriority, setNewPriority] = useState(2)
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    await createOrbit({ name: newName, description: newDesc, color: newColor, icon: newIcon, priority: newPriority, weekly_hours_goal: 4 })
    notify('Órbita criada!')
    onRefresh()
    setShowNew(false)
    setNewName(''); setNewDesc('')
    setSaving(false)
  }

  const COLORS = ['#b5813a', '#4a7c59', '#3a6a7a', '#7a5a8a', '#c47a5a', '#3a5a7a', '#6a7a3a', '#7a3a5a']
  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Órbitas</div>
        <button style={{ padding: '8px 16px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNew(true)}>
          + Nova órbita
        </button>
      </div>
      <div style={{ padding: '28px 32px' }}>
        {showNew && (
          <div style={{ background: C.bg2, border: '1px solid rgba(181,129,58,0.2)', borderRadius: 14, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 18 }}>Nova órbita</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <input style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none' }} placeholder="Nome da órbita" value={newName} onChange={e => setNewName(e.target.value)} />
              <input style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none' }} placeholder="Descrição (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {COLORS.map(c => <button key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }} onClick={() => setNewColor(c)} />)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ORBIT_ICONS.map(icon => (
                <button key={icon.id} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${newIcon === icon.id ? 'rgba(181,129,58,0.4)' : C.border}`, borderRadius: 8, background: newIcon === icon.id ? 'rgba(181,129,58,0.08)' : 'none', cursor: 'pointer' }} onClick={() => setNewIcon(icon.id)} title={icon.label}>
                  <OrbitIcon id={icon.id} size={18} color={newColor} strokeWidth={1.4} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ padding: '9px 20px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Criando...' : 'Criar órbita'}
              </button>
              <button style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNew(false)}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {orbits.map(orbit => {
            const stats = computeOrbitStats(orbit.id, topics, sessions)
            const orbitTopics = topics.filter(t => t.orbit_id === orbit.id)
            return (
              <div key={orbit.id} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 3, background: orbit.color, opacity: 0.6 }} />
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <OrbitIcon id={orbit.icon} size={20} color={orbit.color} />
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: C.text }}>{orbit.name}</div>
                  </div>
                  {orbit.description && <div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>{orbit.description}</div>}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>tópicos</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text }}>{stats.totalTopics}</div></div>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>horas</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text }}>{stats.totalHours}</div></div>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>domínio</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: orbit.color }}>{stats.pct}%</div></div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', width: `${stats.pct}%`, background: orbit.color, borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflow: 'hidden' }}>
                    {orbitTopics.slice(0, 3).map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text2 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.status === 'done' ? orbit.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                        {t.title}
                      </div>
                    ))}
                    {orbitTopics.length > 3 && <div style={{ fontSize: 11, color: C.text3 }}>+{orbitTopics.length - 3} tópicos</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => onNavigate('ciclo')}>▶ Estudar</button>
                    <button style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => onNavigate('importar')}>↑ PDF</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// RevisoesPage.jsx
export function RevisoesPage({ data, notify, onRefresh }) {
  const { reviews = [], topics = [], orbits = [] } = data
  const today = new Date()
  const overdue = reviews.filter(r => new Date(r.due_at) <= today)
  const upcoming = reviews.filter(r => new Date(r.due_at) > today)
  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

  const handleMark = async (reviewId, difficulty) => {
    const { markReview } = await import('../lib/db.js')
    await markReview(reviewId, difficulty)
    const labels = { easy: 'Próxima em 14 dias', medium: 'Próxima em 6 dias', hard: 'Próxima em 1 dia', forgot: 'Revisão amanhã' }
    notify(labels[difficulty] || 'Revisão registrada')
    onRefresh()
  }

  const ReviewCard = ({ r }) => {
    const topic = topics.find(t => t.id === r.topic_id)
    const orbit = orbits.find(o => o.id === r.orbit_id)
    return (
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: orbit?.color || '#888', flexShrink: 0 }} />
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{topic?.title || 'Revisão'}</div>
          <div style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>{orbit?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ k: 'easy', l: 'Fácil', c: '#4a7c59' }, { k: 'medium', l: 'Médio', c: '#b5813a' }, { k: 'hard', l: 'Difícil', c: '#c47a5a' }, { k: 'forgot', l: 'Esqueci', c: '#7a5a8a' }].map(d => (
            <button key={d.k} style={{ flex: 1, padding: '8px', border: `1px solid ${d.c}44`, borderRadius: 8, background: 'transparent', color: d.c, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => handleMark(r.id, d.k)}>{d.l}</button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Revisões</div>
      </div>
      <div style={{ padding: '28px 32px', maxWidth: 640 }}>
        {overdue.length > 0 && <>
          <div style={{ fontSize: 10.5, color: '#c47a5a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Pendentes hoje ({overdue.length})</div>
          {overdue.map(r => <ReviewCard key={r.id} r={r} />)}
        </>}
        {upcoming.length > 0 && <>
          <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 24 }}>Próximas revisões</div>
          {upcoming.slice(0, 5).map(r => {
            const topic = topics.find(t => t.id === r.topic_id)
            const orbit = orbits.find(o => o.id === r.orbit_id)
            const daysLeft = Math.ceil((new Date(r.due_at) - today) / 86400000)
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, opacity: 0.7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: orbit?.color || '#888' }} />
                <div style={{ flex: 1, fontSize: 13, color: C.text }}>{topic?.title}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>em {daysLeft}d</div>
              </div>
            )
          })}
        </>}
        {overdue.length === 0 && upcoming.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.text3, fontSize: 14 }}>Nenhuma revisão agendada ainda</div>
        )}
      </div>
    </div>
  )
}

// MapaPage.jsx
export function MapaPage({ data }) {
  const { orbits = [], topics = [] } = data
  const C = { border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text3: '#4e4a42' }

  const nodeData = topics.slice(0, 18).map((t, i) => {
    const orbit = orbits.find(o => o.id === t.orbit_id)
    const angle = (i / 18) * Math.PI * 2 - Math.PI / 2
    const radius = 80 + (i % 3) * 40
    return {
      x: 340 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle) * 0.6,
      label: t.title,
      color: orbit?.color || '#888',
      size: t.weight ? Math.max(4, Math.min(12, t.weight / 3)) : 6,
      status: t.status,
    }
  })

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Mapa de conhecimento</div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ background: '#131310', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', height: 420 }}>
          <svg width="100%" height="100%" viewBox="0 0 680 420">
            {nodeData.map((n, i) =>
              nodeData.slice(i + 1, i + 3).map((m, j) => (
                <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))
            )}
            {nodeData.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={n.size + 5} fill={n.color} opacity="0.07" />
                <circle cx={n.x} cy={n.y} r={n.size} fill={n.color} opacity={n.status === 'done' ? 0.9 : 0.35} />
                <text x={n.x} y={n.y + n.size + 13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="Geist, system-ui">
                  {n.label.length > 16 ? n.label.slice(0, 14) + '…' : n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {orbits.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.text3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color }} />
              {o.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// MetricasPage.jsx
export function MetricasPage({ data, sessions = [] }) {
  const { orbits = [], topics = [] } = data
  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

  const totalSec = sessions.reduce((s, sess) => s + (sess.duration_sec || 0), 0)
  const totalHours = (totalSec / 3600).toFixed(1)
  const donePct = topics.length ? Math.round((topics.filter(t => t.status === 'done').length / topics.length) * 100) : 0

  const orbitHours = orbits.map(o => ({
    ...o,
    hours: sessions.filter(s => s.orbit_id === o.id).reduce((sum, s) => sum + (s.duration_sec || 0), 0) / 3600,
  }))
  const maxHours = Math.max(...orbitHours.map(o => o.hours), 1)

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Métricas</div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total acumulado', value: `${totalHours}h`, sub: 'todas as órbitas' },
            { label: 'Tópicos dominados', value: `${donePct}%`, sub: `${topics.filter(t => t.status === 'done').length} de ${topics.length}` },
            { label: 'Sessões realizadas', value: sessions.length, sub: 'registradas no app' },
          ].map(c => (
            <div key={c.label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
          <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 }}>Distribuição por órbita</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orbitHours.map(o => (
              <div key={o.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.text2, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OrbitIcon id={o.icon} size={14} color={o.color} />
                    {o.name}
                  </span>
                  <span style={{ color: C.text, fontWeight: 500 }}>{o.hours.toFixed(1)}h</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(o.hours / maxHours) * 100}%`, background: o.color, borderRadius: 99, opacity: 0.8, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
