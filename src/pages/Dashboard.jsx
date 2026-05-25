import { useMemo } from 'react';

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

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

function calcStreak(sessions) {
  if (!sessions?.length) return 0;
  const days = [...new Set(sessions.map((s) => (s.started_at ?? '').slice(0, 10)))]
    .filter(Boolean)
    .sort()
    .reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  for (const day of days) {
    if (day === cursor) {
      streak++;
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    } else break;
  }
  return streak;
}

export default function Dashboard({ data = {}, cycle = [], onNavigate, notify }) {
  const { orbits = [], topics = [], sessions = [], reviews = [] } = data;

  const stats = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekSessions = sessions.filter((s) => (s.started_at ?? '') >= weekAgo);
    const weekSeconds = weekSessions.reduce((a, s) => a + (s.duration_sec ?? 0), 0);
    const totalTopics = topics.length;
    const doneTopics = topics.filter((t) => t.status === 'done').length;
    const pendingReviews = reviews.filter(
      (r) => r.next_review_at && new Date(r.next_review_at) <= new Date()
    ).length;
    return {
      totalTopics,
      doneTopics,
      progressPct: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0,
      weekHours: +(weekSeconds / 3600).toFixed(1),
      weekSessions: weekSessions.length,
      pendingReviews,
      streak: calcStreak(sessions),
    };
  }, [topics, sessions, reviews]);

  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long',
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

      <div className="stats-grid">
        <StatCard label="Progresso geral" value={`${stats.progressPct}%`}
          sub={`${stats.doneTopics} de ${stats.totalTopics} tópicos`}
          accent="#9a6b2a" bar={stats.progressPct} />
        <StatCard label="Esta semana" value={`${stats.weekHours}h`}
          sub={`${stats.weekSessions} sessão${stats.weekSessions !== 1 ? 'ões' : ''}`}
          accent="#4a7c59" />
        <StatCard label="Revisões pendentes" value={stats.pendingReviews}
          sub={stats.pendingReviews > 0 ? 'Revise hoje' : 'Em dia ✓'}
          accent={stats.pendingReviews > 0 ? '#b5603a' : '#4a7c59'}
          onClick={() => onNavigate?.('revisoes')}
          clickable={stats.pendingReviews > 0} />
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Órbitas ativas</h2>
          <button className="section-link" onClick={() => onNavigate?.('orbitas')}>Ver todas →</button>
        </div>
        <div className="orbits-list">
          {orbits.map((o) => (
            <div key={o.id} className="orbit-row" onClick={() => onNavigate?.('orbitas')}>
              <span className="orbit-color-dot" style={{ background: o.color ?? '#888' }} />
              <span className="orbit-name">{o.name}</span>
              <span className="orbit-priority">{o.priority}</span>
            </div>
          ))}
          {orbits.length === 0 && <p className="empty-hint">Nenhuma órbita criada ainda.</p>}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Sessões recentes</h2>
          <button className="section-link" onClick={() => onNavigate?.('metricas')}>Métricas →</button>
        </div>
        <div className="sessions-list">
          {recentSessions.map((s) => {
            const orbit = orbitMap[s.orbit_id];
            return (
              <div key={s.id} className="session-row">
                <span className="session-dot" style={{ background: orbit?.color ?? '#888' }} />
                <div className="session-info">
                  <span className="session-orbit">{orbit?.name ?? 'Órbita removida'}</span>
                  <span className="session-time">
                    {fmtDuration(s.duration_sec ?? 0)} · {relativeTime(s.started_at)}
                  </span>
                </div>
              </div>
            );
          })}
          {recentSessions.length === 0 && <p className="empty-hint">Nenhuma sessão registrada ainda.</p>}
        </div>
      </section>

      <div className="quick-actions">
        <button className="btn-primary" onClick={() => onNavigate?.('ciclo')}>
          Iniciar ciclo de estudos
        </button>
        {stats.pendingReviews > 0 && (
          <button className="btn-secondary" onClick={() => onNavigate?.('revisoes')}>
            Revisar ({stats.pendingReviews})
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, bar, onClick, clickable }) {
  return (
    <div className={`stat-card ${clickable ? 'stat-card--clickable' : ''}`}
      onClick={clickable ? onClick : undefined}
      style={{ '--accent': accent }}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-sub">{sub}</p>
      {bar !== undefined && (
        <div className="stat-bar">
          <div className="stat-bar-fill" style={{ width: `${Math.min(bar, 100)}%` }} />
        </div>
      )}
    </div>
  );
}
