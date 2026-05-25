import { useState } from 'react';
import { OrbitIcon } from '../icons/OrbitIcon.jsx';

const POSITIONS = [
  { cx: 300, cy: 152 },
  { cx: 468, cy: 232 },
  { cx: 132, cy: 232 },
  { cx: 390, cy: 300 },
  { cx: 210, cy: 300 },
  { cx: 300, cy: 328 },
];

export default function MapaPage({ data = {}, onNavigate }) {
  const { orbits = [], topics = [], sessions = [] } = data;
  const [selected, setSelected] = useState(null);

  // Calcular progresso e horas por órbita a partir dos dados em memória
  const mapData = orbits.map((o) => {
    const orbitTopics = topics.filter((t) => t.orbit_id === o.id);
    const done = orbitTopics.filter((t) => t.status === 'done').length;
    const recentCutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    const recentSec = sessions
      .filter((s) => s.orbit_id === o.id && (s.started_at ?? '') >= recentCutoff)
      .reduce((a, s) => a + (s.duration_sec ?? 0), 0);
    return {
      ...o,
      topics: orbitTopics,
      progress: { total: orbitTopics.length, done },
      recentHours: +(recentSec / 3600).toFixed(1),
    };
  });

  const selectedOrbit = mapData.find((o) => o.id === selected);

  return (
    <div className="mapa-page">
      <div className="mapa-header">
        <h1 className="page-title">Mapa de conhecimento</h1>
        <p className="page-subtitle">{mapData.length} órbita{mapData.length !== 1 ? 's' : ''} ativas</p>
      </div>

      <div className="constellation-wrapper">
        <svg className="constellation-svg" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
          {mapData.length > 1 && mapData.map((_, i) => {
            if (i === 0) return null;
            const from = POSITIONS[0];
            const to = POSITIONS[i] ?? POSITIONS[POSITIONS.length - 1];
            return (
              <line key={`line-${i}`}
                x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                stroke="rgba(90,70,40,0.12)" strokeWidth="1" strokeDasharray="4 4" />
            );
          })}

          {mapData.map((orbit, i) => {
            const pos = POSITIONS[i] ?? POSITIONS[POSITIONS.length - 1];
            const pct = orbit.progress.total
              ? Math.round((orbit.progress.done / orbit.progress.total) * 100) : 0;
            const r = 36 + Math.min(orbit.recentHours * 4, 20);
            const isSelected = selected === orbit.id;

            return (
              <g key={orbit.id} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(isSelected ? null : orbit.id)}>
                <ProgressRing cx={pos.cx} cy={pos.cy} r={r} pct={pct} color={orbit.color} />
                <circle cx={pos.cx} cy={pos.cy} r={r - 6}
                  fill={orbit.color + '18'}
                  stroke={orbit.color}
                  strokeWidth={isSelected ? 2.5 : 1.5} />
                <text x={pos.cx} y={pos.cy + r + 16} textAnchor="middle"
                  fill="rgba(44,36,25,0.7)" fontSize="11" fontFamily="Geist, sans-serif">
                  {orbit.name}
                </text>
                <text x={pos.cx} y={pos.cy + 4} textAnchor="middle"
                  fill={orbit.color} fontSize="13" fontWeight="500" fontFamily="Geist, sans-serif">
                  {pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedOrbit && (
        <div className="orbit-detail-panel" style={{ '--orbit-color': selectedOrbit.color }}>
          <div className="panel-header">
            <div className="panel-orbit-name">
              {selectedOrbit.icon && <OrbitIcon name={selectedOrbit.icon} size={20} color={selectedOrbit.color} />}
              <h2>{selectedOrbit.name}</h2>
            </div>
            <button className="panel-close" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="panel-stats">
            <div className="panel-stat">
              <span className="panel-stat-value">{selectedOrbit.progress.done}/{selectedOrbit.progress.total}</span>
              <span className="panel-stat-label">tópicos concluídos</span>
            </div>
            <div className="panel-stat">
              <span className="panel-stat-value">{selectedOrbit.recentHours}h</span>
              <span className="panel-stat-label">nos últimos 30 dias</span>
            </div>
            <div className="panel-stat">
              <span className="panel-stat-value">
                {selectedOrbit.progress.total
                  ? Math.round((selectedOrbit.progress.done / selectedOrbit.progress.total) * 100) : 0}%
              </span>
              <span className="panel-stat-label">concluído</span>
            </div>
          </div>
          {selectedOrbit.topics.length > 0 && (
            <div className="panel-topics">
              <p className="panel-topics-label">Tópicos</p>
              {selectedOrbit.topics.slice(0, 6).map((t) => (
                <div key={t.id} className="panel-topic-row">
                  <span className={`topic-status-dot topic-status-dot--${t.status}`} />
                  <span className="panel-topic-name">{t.name}</span>
                </div>
              ))}
              {selectedOrbit.topics.length > 6 && (
                <p className="panel-topics-more">+{selectedOrbit.topics.length - 6} tópicos</p>
              )}
            </div>
          )}
          <button className="btn-primary panel-cta" onClick={() => onNavigate?.('ciclo')}>
            Estudar esta órbita
          </button>
        </div>
      )}

      <div className="mapa-legend">
        {mapData.map((o) => (
          <div key={o.id} className="legend-item"
            onClick={() => setSelected(o.id === selected ? null : o.id)}>
            <span className="legend-dot" style={{ background: o.color }} />
            <span className="legend-name">{o.name}</span>
            <span className="legend-pct">
              {o.progress.total ? Math.round((o.progress.done / o.progress.total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressRing({ cx, cy, r, pct, color }) {
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(90,70,40,0.10)" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </>
  );
}
