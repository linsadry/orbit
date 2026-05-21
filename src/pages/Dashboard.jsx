import { useState, useEffect } from 'react';
import { getDashboardStats, getOrbits, getSessions } from '../lib/db.js';

// Formata segundos em "Xh Ym"
function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Formata data relativa
function relativeTime(isoStr) {
  if (!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [orbits, setOrbits] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, o, sessions] = await Promise.all([
          getDashboardStats(),
          getOrbits(),
          getSessions({ limit: 5 }),
        ]);
        setStats(s);
        setOrbits(o);
        setRecentSessions(sessions);
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="orbit-spinner" />
        <p>Carregando…</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));

  return (
    <div className="dashboard">
      {/* ── Cabeçalho ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        {stats.streak > 0 && (
          <div className="streak-badge">
            <span className="streak-icon">🔥</span>
            <span className="streak-count">{stats.streak}</span>
            <span className="streak-label">dias seguidos</span>
          </div>
        )}
      </div>

      {/* ── Cards de estatísticas ── */}
      <div className="stats-grid">
        <StatCard
          label="Progresso geral"
          value={`${stats.progressPct}%`}
          sub={`${stats.doneTopics} de ${stats.totalTopics} tópicos`}
          accent="#c9a96e"
          bar={stats.progressPct}
        />
        <StatCard
          label="Esta semana"
          value={`${stats.weekHours}h`}
          sub={`${stats.weekSessions} sessão${stats.weekSessions !== 1 ? 'ões' : ''}`}
          accent="#7a9e78"
        />
        <StatCard
          label="Revisões pendentes"
          value={stats.pendingReviews}
          sub={stats.pendingReviews > 0 ? 'Revise hoje' : 'Em dia ✓'}
          accent={stats.pendingReviews > 0 ? '#e07b6a' : '#7a9e78'}
          onClick={() => onNavigate?.('revisoes')}
          clickable={stats.pendingReviews > 0}
        />
      </div>

      {/* ── Órbitas ── */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Órbitas ativas</h2>
          <button
            className="section-link"
            onClick={() => onNavigate?.('orbitas')}
          >
            Ver todas →
          </button>
        </div>
        <div className="orbits-list">
          {orbits.map((o) => (
            <OrbitRow
              key={o.id}
              orbit={o}
              onClick={() => onNavigate?.('orbitas', o.id)}
            />
          ))}
          {orbits.length === 0 && (
            <p className="empty-hint">Nenhuma órbita criada ainda.</p>
          )}
        </div>
      </section>

      {/* ── Sessões recentes ── */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Sessões recentes</h2>
          <button
            className="section-link"
            onClick={() => onNavigate?.('metricas')}
          >
            Métricas →
          </button>
        </div>
        <div className="sessions-list">
          {recentSessions.map((s) => {
            const orbit = orbitMap[s.orbit_id];
            return (
              <div key={s.id} className="session-row">
                <span
                  className="session-dot"
                  style={{ background: orbit?.color ?? '#888' }}
                />
                <div className="session-info">
                  <span className="session-orbit">
                    {orbit?.name ?? 'Órbita removida'}
                  </span>
                  <span className="session-time">
                    {fmtDuration(s.duration_sec ?? 0)} ·{' '}
                    {relativeTime(s.started_at)}
                  </span>
                </div>
              </div>
            );
          })}
          {recentSessions.length === 0 && (
            <p className="empty-hint">Nenhuma sessão registrada ainda.</p>
          )}
        </div>
      </section>

      {/* ── Ação rápida ── */}
      <div className="quick-actions">
        <button
          className="btn-primary"
          onClick={() => onNavigate?.('ciclo')}
        >
          Iniciar ciclo de estudos
        </button>
        {stats.pendingReviews > 0 && (
          <button
            className="btn-secondary"
            onClick={() => onNavigate?.('revisoes')}
          >
            Revisar ({stats.pendingReviews})
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, bar, onClick, clickable }) {
  return (
    <div
      className={`stat-card ${clickable ? 'stat-card--clickable' : ''}`}
      onClick={clickable ? onClick : undefined}
      style={{ '--accent': accent }}
    >
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-sub">{sub}</p>
      {bar !== undefined && (
        <div className="stat-bar">
          <div
            className="stat-bar-fill"
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function OrbitRow({ orbit, onClick }) {
  return (
    <div className="orbit-row" onClick={onClick}>
      <span
        className="orbit-color-dot"
        style={{ background: orbit.color ?? '#888' }}
      />
      <span className="orbit-name">{orbit.name}</span>
      <span className="orbit-priority">{orbit.priority}</span>
    </div>
  );
}
