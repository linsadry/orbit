import { useState, useEffect, useRef, useCallback } from 'react';
import { buildCycle } from '../lib/cycleEngine.js';
import { saveSession, upsertReview, updateTopic, getOrbits } from '../lib/db.js';
import { OrbitIcon } from '../icons/OrbitIcon.jsx';

const STATUS_LABELS = { todo: 'A fazer', in_progress: 'Em progresso', done: 'Concluído' };
const DIFF_LABELS = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
const DIFF_COLORS = { easy: '#7a9e78', medium: '#c9a96e', hard: '#c47a7a' };

export default function CicloPage() {
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orbits, setOrbits] = useState([]);

  // Timer
  const [timerState, setTimerState] = useState('idle'); // idle | running | paused | done
  const [elapsed, setElapsed] = useState(0); // segundos efetivos
  const [sessionStart, setSessionStart] = useState(null);
  const intervalRef = useRef(null);
  const pausedAt = useRef(null);

  // Feedback de revisão
  const [showReview, setShowReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadCycle();
  }, []);

  async function loadCycle() {
    setLoading(true);
    setError(null);
    try {
      const [q, o] = await Promise.all([buildCycle(), getOrbits()]);
      setQueue(q);
      setOrbits(o);
      setCurrentIdx(0);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar ciclo.');
    } finally {
      setLoading(false);
    }
  }

  // ── Timer ────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    setSessionStart(new Date().toISOString());
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    pausedAt.current = Date.now();
    setTimerState('paused');
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    setTimerState('done');
    setShowReview(true);
  }, []);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── Salvar sessão + revisão ───────────────────────────────────────────────

  async function handleReview(rating) {
    if (!queue[currentIdx]) return;
    setSaving(true);
    const topic = queue[currentIdx];
    try {
      await Promise.all([
        saveSession({
          orbit_id: topic.orbit_id,
          topic_id: topic.id,
          started_at: sessionStart ?? new Date().toISOString(),
          duration_sec: elapsed,
        }),
        upsertReview(topic.id, rating),
        // se esqueceu ou difícil, mantém status; se fácil/médio e era todo → in_progress
        topic.status === 'todo'
          ? updateTopic(topic.id, { status: 'in_progress' })
          : Promise.resolve(),
      ]);
      setSavedMsg('Sessão salva ✓');
      setTimeout(() => {
        setSavedMsg('');
        setShowReview(false);
        setTimerState('idle');
        setElapsed(0);
        setSessionStart(null);
        // Avança para o próximo tópico
        setCurrentIdx((i) => (i + 1 < queue.length ? i + 1 : 0));
        // Recarrega ciclo do banco para scores atualizados
        loadCycle();
      }, 1200);
    } catch (e) {
      console.error(e);
      setSavedMsg('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function markDone() {
    if (!queue[currentIdx]) return;
    setSaving(true);
    try {
      await updateTopic(queue[currentIdx].id, { status: 'done' });
      setSavedMsg('Tópico concluído ✓');
      setTimeout(() => {
        setSavedMsg('');
        loadCycle();
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ── Formatação ───────────────────────────────────────────────────────────

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page-loading">
        <div className="orbit-spinner" />
        <p>Calculando ciclo…</p>
      </div>
    );
  }

  if (error) return <div className="page-error">{error}</div>;

  if (queue.length === 0) {
    return (
      <div className="ciclo-empty">
        <p>🎉 Nenhum tópico pendente no momento.</p>
        <button className="btn-secondary" onClick={loadCycle}>
          Recarregar
        </button>
      </div>
    );
  }

  const topic = queue[currentIdx];
  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));
  const orbit = orbitMap[topic.orbit_id];

  return (
    <div className="ciclo-page">
      <div className="ciclo-header">
        <h1 className="page-title">Ciclo adaptativo</h1>
        <span className="ciclo-count">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* ── Card do tópico atual ── */}
      <div className="ciclo-card" style={{ '--orbit-color': topic.orbitColor ?? '#888' }}>
        <div className="ciclo-card-orbit">
          {orbit?.icon && (
            <OrbitIcon name={orbit.icon} size={18} color={topic.orbitColor} />
          )}
          <span style={{ color: topic.orbitColor }}>{topic.orbitName}</span>
        </div>

        <h2 className="ciclo-topic-name">{topic.name}</h2>

        {topic.subtopics?.length > 0 && (
          <ul className="ciclo-subtopics">
            {topic.subtopics.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}

        <div className="ciclo-meta">
          <span
            className="diff-badge"
            style={{ background: DIFF_COLORS[topic.difficulty] + '33', color: DIFF_COLORS[topic.difficulty] }}
          >
            {DIFF_LABELS[topic.difficulty] ?? topic.difficulty}
          </span>
          <span className="status-badge">{STATUS_LABELS[topic.status] ?? topic.status}</span>
          {topic.needsReview && (
            <span className="review-badge">⟳ Revisão pendente</span>
          )}
          <span className="score-badge">Score: {topic.score}</span>
        </div>
      </div>

      {/* ── Timer ── */}
      {!showReview && (
        <div className="timer-block">
          <div className="timer-display">{fmtTime(elapsed)}</div>
          <div className="timer-controls">
            {timerState === 'idle' && (
              <button className="btn-primary" onClick={startTimer}>
                ▶ Iniciar sessão
              </button>
            )}
            {timerState === 'running' && (
              <>
                <button className="btn-secondary" onClick={pauseTimer}>
                  ⏸ Pausar
                </button>
                <button className="btn-danger" onClick={stopTimer}>
                  ⏹ Encerrar
                </button>
              </>
            )}
            {timerState === 'paused' && (
              <>
                <button className="btn-primary" onClick={resumeTimer}>
                  ▶ Retomar
                </button>
                <button className="btn-danger" onClick={stopTimer}>
                  ⏹ Encerrar
                </button>
              </>
            )}
          </div>
          {timerState !== 'idle' && (
            <button className="btn-ghost" onClick={markDone} disabled={saving}>
              Marcar como concluído
            </button>
          )}
        </div>
      )}

      {/* ── Review SRS ── */}
      {showReview && (
        <div className="review-block">
          <p className="review-question">Como foi esse tópico?</p>
          <div className="review-actions">
            {[
              { rating: 'forgot', label: 'Esqueci', color: '#c47a7a' },
              { rating: 'hard', label: 'Difícil', color: '#e09a5a' },
              { rating: 'medium', label: 'Médio', color: '#c9a96e' },
              { rating: 'easy', label: 'Fácil', color: '#7a9e78' },
            ].map(({ rating, label, color }) => (
              <button
                key={rating}
                className="review-btn"
                style={{ '--review-color': color }}
                onClick={() => handleReview(rating)}
                disabled={saving}
              >
                {label}
              </button>
            ))}
          </div>
          {savedMsg && <p className="saved-msg">{savedMsg}</p>}
        </div>
      )}

      {/* ── Fila ── */}
      <div className="ciclo-queue">
        <p className="queue-label">Próximos na fila</p>
        {queue.slice(currentIdx + 1, currentIdx + 4).map((t, i) => (
          <div key={t.id} className="queue-item">
            <span
              className="queue-dot"
              style={{ background: t.orbitColor }}
            />
            <span className="queue-topic">{t.name}</span>
            <span className="queue-orbit">{t.orbitName}</span>
          </div>
        ))}
        {queue.slice(currentIdx + 1).length === 0 && (
          <p className="empty-hint">Você está no último tópico da fila.</p>
        )}
      </div>

      <div className="ciclo-footer">
        <button className="btn-ghost" onClick={loadCycle}>
          ↻ Recalcular ciclo
        </button>
        <button
          className="btn-ghost"
          onClick={() =>
            setCurrentIdx((i) => (i + 1 < queue.length ? i + 1 : i))
          }
          disabled={currentIdx >= queue.length - 1}
        >
          Pular →
        </button>
      </div>
    </div>
  );
}
