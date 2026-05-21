import { useState, useEffect } from 'react';
import {
  getDailyHours,
  getHoursByOrbit,
  getProgressByOrbit,
  getOrbits,
  getSessions,
} from '../lib/db.js';

export default function MetricasPage() {
  const [orbits, setOrbits] = useState([]);
  const [dailyHours, setDailyHours] = useState([]);
  const [hoursByOrbit, setHoursByOrbit] = useState([]);
  const [progressByOrbit, setProgressByOrbit] = useState({});
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(14); // dias

  useEffect(() => {
    load();
  }, [range]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [o, dh, hbo, pbo, sessions] = await Promise.all([
        getOrbits(),
        getDailyHours(range),
        getHoursByOrbit(range),
        getProgressByOrbit(),
        getSessions({ limit: 20 }),
      ]);
      setOrbits(o);
      setDailyHours(dh);
      setHoursByOrbit(hbo);
      setProgressByOrbit(pbo);
      setRecentSessions(sessions);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar métricas.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="orbit-spinner" />
        <p>Calculando métricas…</p>
      </div>
    );
  }

  if (error) return <div className="page-error">{error}</div>;

  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));
  const totalHours = hoursByOrbit.reduce((a, b) => a + b.hours, 0);
  const totalDone = Object.values(progressByOrbit).reduce((a, b) => a + b.done, 0);
  const totalTopics = Object.values(progressByOrbit).reduce((a, b) => a + b.total, 0);
  const maxDailyH = Math.max(...dailyHours.map((d) => d.hours), 0.1);

  return (
    <div className="metricas-page">
      <div className="metricas-header">
        <h1 className="page-title">Métricas</h1>
        <div className="range-tabs">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              className={`range-tab ${range === d ? 'range-tab--active' : ''}`}
              onClick={() => setRange(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Resumo ── */}
      <div className="metricas-summary">
        <SummaryCard
          label="Horas estudadas"
          value={`${totalHours.toFixed(1)}h`}
          sub={`últimos ${range} dias`}
        />
        <SummaryCard
          label="Sessões"
          value={recentSessions.length}
          sub="recentes"
        />
        <SummaryCard
          label="Tópicos concluídos"
          value={`${totalDone}/${totalTopics}`}
          sub={`${totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0}% do total`}
        />
      </div>

      {/* ── Gráfico de linha: horas/dia ── */}
      <section className="metricas-section">
        <h2 className="section-title">Horas por dia</h2>
        <div className="line-chart">
          {dailyHours.map((d, i) => (
            <div key={d.date} className="line-bar-col">
              <div className="line-bar-wrap">
                <div
                  className="line-bar"
                  style={{ height: `${(d.hours / maxDailyH) * 100}%` }}
                  title={`${d.hours}h`}
                />
              </div>
              <span className="line-bar-label">
                {i % 3 === 0
                  ? new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'numeric',
                    })
                  : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Distribuição por órbita ── */}
      <section className="metricas-section">
        <h2 className="section-title">Tempo por órbita</h2>
        {hoursByOrbit.length === 0 ? (
          <p className="empty-hint">Nenhuma sessão registrada neste período.</p>
        ) : (
          <div className="orbit-bars">
            {hoursByOrbit
              .sort((a, b) => b.hours - a.hours)
              .map((item) => {
                const orbit = orbitMap[item.orbit_id];
                const pct = totalHours > 0 ? (item.hours / totalHours) * 100 : 0;
                return (
                  <div key={item.orbit_id} className="orbit-bar-row">
                    <span className="orbit-bar-name">
                      {orbit?.name ?? 'Desconhecida'}
                    </span>
                    <div className="orbit-bar-track">
                      <div
                        className="orbit-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: orbit?.color ?? '#888',
                        }}
                      />
                    </div>
                    <span className="orbit-bar-value">{item.hours}h</span>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* ── Progresso por órbita ── */}
      <section className="metricas-section">
        <h2 className="section-title">Progresso por órbita</h2>
        <div className="progress-cards">
          {orbits.map((o) => {
            const prog = progressByOrbit[o.id] ?? { total: 0, done: 0 };
            const pct = prog.total
              ? Math.round((prog.done / prog.total) * 100)
              : 0;
            return (
              <div key={o.id} className="progress-card">
                <div className="progress-card-header">
                  <span style={{ color: o.color }}>{o.name}</span>
                  <span className="progress-pct">{pct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: o.color }}
                  />
                </div>
                <p className="progress-sub">
                  {prog.done} de {prog.total} tópicos
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Histórico de sessões ── */}
      <section className="metricas-section">
        <h2 className="section-title">Histórico de sessões</h2>
        {recentSessions.length === 0 ? (
          <p className="empty-hint">Nenhuma sessão registrada ainda.</p>
        ) : (
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Órbita</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => {
                const orbit = orbitMap[s.orbit_id];
                return (
                  <tr key={s.id}>
                    <td>
                      {new Date(s.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span
                        className="table-orbit-dot"
                        style={{ background: orbit?.color ?? '#888' }}
                      />
                      {orbit?.name ?? '—'}
                    </td>
                    <td>{fmtDuration(s.duration_sec ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="summary-card">
      <p className="summary-label">{label}</p>
      <p className="summary-value">{value}</p>
      <p className="summary-sub">{sub}</p>
    </div>
  );
}

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}
