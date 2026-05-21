import { useState, useEffect, useRef } from 'react';
import { getMapData } from '../lib/db.js';
import OrbitIcon from '../icons/OrbitIcon.jsx';

// Posições fixas para até 6 órbitas em layout constelação
const POSITIONS = [
  { cx: '50%', cy: '38%' },
  { cx: '78%', cy: '58%' },
  { cx: '22%', cy: '58%' },
  { cx: '65%', cy: '75%' },
  { cx: '35%', cy: '75%' },
  { cx: '50%', cy: '82%' },
];

export default function MapaPage({ onNavigate }) {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMapData();
        setMapData(data);
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar mapa.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="orbit-spinner" />
        <p>Mapeando constelação…</p>
      </div>
    );
  }

  if (error) return <div className="page-error">{error}</div>;

  const selectedOrbit = mapData.find((o) => o.id === selected);

  return (
    <div className="mapa-page">
      <div className="mapa-header">
        <h1 className="page-title">Mapa de conhecimento</h1>
        <p className="page-subtitle">
          {mapData.length} órbita{mapData.length !== 1 ? 's' : ''} ativas
        </p>
      </div>

      {/* ── Constelação SVG ── */}
      <div className="constellation-wrapper">
        <svg
          ref={svgRef}
          className="constellation-svg"
          viewBox="0 0 600 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Linhas de conexão */}
          {mapData.length > 1 &&
            mapData.map((_, i) => {
              if (i === 0) return null;
              const from = resolvePosition(POSITIONS[0], 600, 400);
              const to = resolvePosition(POSITIONS[i], 600, 400);
              return (
                <line
                  key={`line-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* Nós das órbitas */}
          {mapData.map((orbit, i) => {
            const pos = POSITIONS[i] ?? POSITIONS[POSITIONS.length - 1];
            const { x, y } = resolvePosition(pos, 600, 400);
            const pct = orbit.progress.total
              ? Math.round((orbit.progress.done / orbit.progress.total) * 100)
              : 0;
            const r = 36 + Math.min(orbit.recentHours * 4, 20); // raio dinâmico por atividade
            const isSelected = selected === orbit.id;

            return (
              <g
                key={orbit.id}
                className="orbit-node"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(isSelected ? null : orbit.id)}
              >
                {/* Anel de progresso */}
                <ProgressRing cx={x} cy={y} r={r} pct={pct} color={orbit.color} />

                {/* Círculo central */}
                <circle
                  cx={x}
                  cy={y}
                  r={r - 6}
                  fill={orbit.color + '22'}
                  stroke={orbit.color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Label */}
                <text
                  x={x}
                  y={y + r + 16}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="11"
                  fontFamily="Geist, sans-serif"
                >
                  {orbit.name}
                </text>

                {/* Porcentagem dentro */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={orbit.color}
                  fontSize="13"
                  fontWeight="500"
                  fontFamily="Geist, sans-serif"
                >
                  {pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Painel de detalhes da órbita selecionada ── */}
      {selectedOrbit && (
        <div className="orbit-detail-panel" style={{ '--orbit-color': selectedOrbit.color }}>
          <div className="panel-header">
            <div className="panel-orbit-name">
              {selectedOrbit.icon && (
                <OrbitIcon name={selectedOrbit.icon} size={20} color={selectedOrbit.color} />
              )}
              <h2>{selectedOrbit.name}</h2>
            </div>
            <button className="panel-close" onClick={() => setSelected(null)}>
              ×
            </button>
          </div>

          <div className="panel-stats">
            <div className="panel-stat">
              <span className="panel-stat-value">
                {selectedOrbit.progress.done}/{selectedOrbit.progress.total}
              </span>
              <span className="panel-stat-label">tópicos concluídos</span>
            </div>
            <div className="panel-stat">
              <span className="panel-stat-value">{selectedOrbit.recentHours}h</span>
              <span className="panel-stat-label">nos últimos 30 dias</span>
            </div>
            <div className="panel-stat">
              <span className="panel-stat-value">
                {selectedOrbit.progress.total
                  ? Math.round(
                      (selectedOrbit.progress.done / selectedOrbit.progress.total) * 100
                    )
                  : 0}
                %
              </span>
              <span className="panel-stat-label">concluído</span>
            </div>
          </div>

          {/* Amostra de tópicos */}
          {selectedOrbit.topics.length > 0 && (
            <div className="panel-topics">
              <p className="panel-topics-label">Tópicos</p>
              {selectedOrbit.topics.slice(0, 6).map((t) => (
                <div key={t.id} className="panel-topic-row">
                  <span
                    className={`topic-status-dot topic-status-dot--${t.status}`}
                  />
                  <span className="panel-topic-name">{t.name}</span>
                </div>
              ))}
              {selectedOrbit.topics.length > 6 && (
                <p className="panel-topics-more">
                  +{selectedOrbit.topics.length - 6} tópicos
                </p>
              )}
            </div>
          )}

          <button
            className="btn-primary panel-cta"
            onClick={() => onNavigate?.('ciclo')}
          >
            Estudar esta órbita
          </button>
        </div>
      )}

      {/* ── Legenda ── */}
      <div className="mapa-legend">
        {mapData.map((o) => (
          <div
            key={o.id}
            className="legend-item"
            onClick={() => setSelected(o.id === selected ? null : o.id)}
          >
            <span className="legend-dot" style={{ background: o.color }} />
            <span className="legend-name">{o.name}</span>
            <span className="legend-pct">
              {o.progress.total
                ? Math.round((o.progress.done / o.progress.total) * 100)
                : 0}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolvePosition(pos, width, height) {
  const x =
    typeof pos.cx === 'string' && pos.cx.endsWith('%')
      ? (parseFloat(pos.cx) / 100) * width
      : parseFloat(pos.cx);
  const y =
    typeof pos.cy === 'string' && pos.cy.endsWith('%')
      ? (parseFloat(pos.cy) / 100) * height
      : parseFloat(pos.cy);
  return { x, y };
}

function ProgressRing({ cx, cy, r, pct, color }) {
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="4"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </>
  );
}
