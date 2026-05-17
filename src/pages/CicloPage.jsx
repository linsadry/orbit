import { useState, useEffect, useRef } from 'react'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'
import { createSession, createReview, updateTopic } from '../lib/db.js'

export default function CicloPage({ data, cycle, completedIds, onComplete, notify, onRefresh }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [timerSec, setTimerSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | studying | done
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState(3)
  const intervalRef = useRef(null)

  const pending = cycle.filter(c => !completedIds.includes(c.id))
  const current = pending[activeIdx] || pending[0]

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const startSession = () => {
    setRunning(true)
    setPhase('studying')
    setTimerSec(0)
  }

  const pauseSession = () => setRunning(false)
  const resumeSession = () => setRunning(true)

  const finishSession = async (difficulty) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setPhase('done')

    if (!current) return

    // Save session
    await createSession({
      orbit_id: current.orbitId,
      topic_id: current.topicId,
      duration_sec: timerSec,
      difficulty_after: difficulty,
      notes,
    })

    // Schedule review
    await createReview(current.topicId, current.orbitId)

    // If study (not review), update topic status
    if (current.type === 'study') {
      const status = difficulty === 'hard' || difficulty === 'forgot' ? 'in_progress' : 'in_progress'
      await updateTopic(current.topicId, { status })
    }

    notify(`Sessão de ${formatTime(timerSec)} registrada. Revisão agendada!`)
    onComplete(current.id)
    onRefresh()

    setTimeout(() => {
      setPhase('idle')
      setTimerSec(0)
      setNotes('')
      setActiveIdx(0)
    }, 1500)
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div>
      <div style={s.topbar}>
        <div style={s.topbarTitle}>Ciclo de estudos</div>
        <div style={s.topbarMeta}>
          {pending.length} {pending.length === 1 ? 'item' : 'itens'} restantes ·{' '}
          {pending.reduce((sum, i) => sum + i.estimatedMinutes, 0)}min estimados
        </div>
      </div>

      <div style={s.content}>
        {/* Timer */}
        {current ? (
          <div style={s.timerBlock}>
            <div style={s.timerOrbit}>
              <OrbitIcon id={current.orbitIcon} size={18} color={current.orbitColor} />
              <span style={{ color: current.orbitColor, fontSize: 12 }}>{current.orbitName}</span>
              <span style={s.timerTypeBadge}>
                {current.type === 'review' ? 'revisão' : 'estudo'}
              </span>
            </div>
            <div style={s.timerTitle}>{current.title}</div>
            {current.subtitle && <div style={s.timerSub}>{current.subtitle}</div>}

            <div style={s.timerDisplay}>{formatTime(timerSec)}</div>

            {phase === 'idle' && (
              <button style={s.startBtn} onClick={startSession}>
                Iniciar sessão
              </button>
            )}

            {phase === 'studying' && (
              <div style={s.controls}>
                <button style={s.controlBtn} onClick={running ? pauseSession : resumeSession}>
                  {running ? '⏸ Pausar' : '▶ Retomar'}
                </button>
                <div style={s.divider} />
                <div style={s.finishLabel}>Como foi a sessão?</div>
                <div style={s.diffButtons}>
                  {[
                    { key: 'easy', label: 'Fácil', color: '#4a7c59' },
                    { key: 'medium', label: 'Médio', color: '#b5813a' },
                    { key: 'hard', label: 'Difícil', color: '#c47a5a' },
                    { key: 'forgot', label: 'Esqueci', color: '#7a5a8a' },
                  ].map(d => (
                    <button key={d.key} style={{ ...s.diffBtn, borderColor: `${d.color}44`, color: d.color }}
                      onClick={() => finishSession(d.key)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <textarea
                  style={s.notesInput}
                  placeholder="Anotações da sessão (opcional)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {phase === 'done' && (
              <div style={s.doneMsg}>Registrado ✓</div>
            )}
          </div>
        ) : (
          <div style={s.emptyTimer}>
            <div style={s.emptyIcon}>○</div>
            <div style={s.emptyTitle}>Ciclo completo</div>
            <div style={s.emptySub}>Todas as sessões de hoje foram concluídas</div>
          </div>
        )}

        {/* Queue */}
        <div style={s.queueSection}>
          <div style={s.sectionLabel}>Fila do ciclo</div>
          <div style={s.queue}>
            {pending.map((item, i) => (
              <div
                key={item.id}
                style={{
                  ...s.queueItem,
                  ...(i === 0 ? s.queueItemActive : {}),
                  opacity: i === 0 ? 1 : 0.65 + (i < 3 ? 0 : -0.15),
                }}
                onClick={() => setActiveIdx(i)}
              >
                <div style={s.queueNum}>{i + 1}</div>
                <OrbitIcon id={item.orbitIcon} size={14} color={item.orbitColor} />
                <div style={s.queueInfo}>
                  <div style={s.queueTitle}>{item.title}</div>
                  <div style={s.queueMeta}>{item.orbitName} · {item.estimatedMinutes}min</div>
                </div>
                {item.type === 'review' && (
                  <span style={s.reviewBadge}>revisão</span>
                )}
                {item.adjusted && (
                  <span style={s.adjustedBadge}>ajustado</span>
                )}
              </div>
            ))}
            {pending.length === 0 && (
              <div style={s.emptyQueue}>Ciclo vazio — adicione tópicos às suas órbitas</div>
            )}
          </div>
        </div>

        {/* Cycle config hint */}
        <div style={s.configHint}>
          <span style={s.configHintIcon}>○</span>
          O ciclo é construído automaticamente por prioridade, peso dos tópicos e recência.
          Ajuste nas configurações de cada órbita.
        </div>
      </div>
    </div>
  )
}

const C = {
  bg2: '#131310', bg3: '#1a1a16',
  border: 'rgba(255,255,255,0.055)',
  text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42',
  accent: '#b5813a',
}

const s = {
  topbar: {
    padding: '20px 32px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'baseline',
    gap: 16,
    position: 'sticky',
    top: 0,
    background: '#0d0d0b',
    zIndex: 10,
  },
  topbarTitle: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 20,
    color: C.text,
    fontWeight: 400,
  },
  topbarMeta: { fontSize: 12, color: C.text3 },
  content: { padding: '28px 32px' },
  timerBlock: {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '32px 36px',
    marginBottom: 28,
    maxWidth: 560,
  },
  timerOrbit: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timerTypeBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 99,
    border: `1px solid ${C.border}`,
    color: C.text3,
    marginLeft: 4,
  },
  timerTitle: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 26,
    color: C.text,
    fontWeight: 400,
    marginBottom: 4,
  },
  timerSub: { fontSize: 13, color: C.text3, marginBottom: 24 },
  timerDisplay: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 64,
    color: C.text,
    letterSpacing: 4,
    fontWeight: 400,
    lineHeight: 1,
    marginBottom: 28,
  },
  startBtn: {
    padding: '11px 28px',
    background: 'rgba(181,129,58,0.12)',
    border: '1px solid rgba(181,129,58,0.3)',
    borderRadius: 10,
    color: C.accent,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Geist', system-ui, sans-serif",
    letterSpacing: 0.3,
    transition: 'all 0.15s',
  },
  controls: { display: 'flex', flexDirection: 'column', gap: 14 },
  controlBtn: {
    alignSelf: 'flex-start',
    padding: '9px 20px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text2,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Geist', system-ui, sans-serif",
  },
  divider: { height: 1, background: C.border, margin: '4px 0' },
  finishLabel: { fontSize: 12, color: C.text3 },
  diffButtons: { display: 'flex', gap: 8 },
  diffBtn: {
    flex: 1,
    padding: '9px 4px',
    borderRadius: 8,
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
    fontSize: 12.5,
    cursor: 'pointer',
    fontFamily: "'Geist', system-ui, sans-serif",
    transition: 'all 0.15s',
  },
  notesInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: C.text2,
    fontSize: 13,
    fontFamily: "'Geist', system-ui, sans-serif",
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
  },
  doneMsg: {
    fontSize: 18,
    color: '#4a7c59',
    fontFamily: "'Instrument Serif', Georgia, serif",
  },
  emptyTimer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '60px 32px',
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    marginBottom: 28,
    maxWidth: 560,
  },
  emptyIcon: { fontSize: 36, color: C.text3, opacity: 0.4 },
  emptyTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text2 },
  emptySub: { fontSize: 13, color: C.text3, textAlign: 'center' },
  queueSection: {},
  sectionLabel: {
    fontSize: 10.5,
    color: C.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  queue: { display: 'flex', flexDirection: 'column', gap: 6 },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    cursor: 'pointer',
    background: C.bg2,
    transition: 'all 0.13s',
  },
  queueItemActive: {
    border: '1px solid rgba(181,129,58,0.25)',
    background: 'rgba(181,129,58,0.04)',
  },
  queueNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: C.text3,
    flexShrink: 0,
  },
  queueInfo: { flex: 1 },
  queueTitle: { fontSize: 13, color: C.text, fontWeight: 500 },
  queueMeta: { fontSize: 11, color: C.text3, marginTop: 2 },
  reviewBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 99,
    border: '1px solid rgba(196,122,90,0.3)',
    color: '#c47a5a',
  },
  adjustedBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 99,
    border: `1px solid ${C.border}`,
    color: C.text3,
  },
  emptyQueue: { fontSize: 13, color: C.text3, padding: '20px 0', textAlign: 'center' },
  configHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${C.border}`,
    fontSize: 12,
    color: C.text3,
  },
  configHintIcon: { color: C.accent, fontSize: 14, flexShrink: 0 },
}
