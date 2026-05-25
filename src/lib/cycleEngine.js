import { getOrbits, getTopics, getReviews } from './db.js';

/**
 * Score de prioridade para um tópico.
 * score = prioridade_órbita × dificuldade_tópico + bônus_revisão_pendente
 */
function calcScore(topic, orbit, pendingReviewIds) {
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const diffWeight = { hard: 3, medium: 2, easy: 1 };

  const p = priorityWeight[orbit?.priority] ?? 1;
  const d = diffWeight[topic.difficulty] ?? 2;
  const reviewBonus = pendingReviewIds.has(topic.id) ? 5 : 0;

  return p * d + reviewBonus;
}

/**
 * Monta a fila do ciclo.
 * Aceita dados já carregados (síncrono) OU busca do banco (assíncrono).
 *
 * Uso pelo App.jsx (síncrono):
 *   buildCycle({ orbits, topics, sessions, reviews, config })
 *
 * Uso interno (assíncrono):
 *   await buildCycle()
 */
export function buildCycle(preloaded) {
  if (preloaded) {
    // Chamada síncrona com dados já carregados
    return _buildFromData(
      preloaded.orbits ?? [],
      preloaded.topics ?? [],
      preloaded.reviews ?? []
    );
  }
  // Chamada assíncrona — busca do banco
  return _buildAsync();
}

function _buildFromData(orbits, topics, reviews) {
  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));
  const now = new Date();
  const pendingReviewIds = new Set(
    reviews
      .filter((r) => r.next_review_at && new Date(r.next_review_at) <= now)
      .map((r) => r.topic_id)
  );

  return topics
    .filter((t) => {
      if (pendingReviewIds.has(t.id)) return true;
      return t.status !== 'done';
    })
    .map((t) => {
      const orbit = orbitMap[t.orbit_id];
      return {
        ...t,
        orbitName: orbit?.name ?? '—',
        orbitColor: orbit?.color ?? '#888',
        score: calcScore(t, orbit, pendingReviewIds),
        needsReview: pendingReviewIds.has(t.id),
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function _buildAsync() {
  const [orbits, topics, pendingReviews] = await Promise.all([
    getOrbits(),
    getTopics(),
    getReviews({ pending: true }),
  ]);
  return _buildFromData(orbits, topics, pendingReviews);
}

/**
 * Retorna apenas o próximo tópico da fila.
 */
export async function getNextTopic() {
  const queue = await buildCycle();
  return queue[0] ?? null;
}

/**
 * Compatibilidade com Sidebar.jsx.
 * Recebe os dados já carregados e retorna stats por órbita.
 */
export function computeOrbitStats(orbits = [], topics = [], reviews = []) {
  const pendingReviewIds = new Set(
    reviews
      .filter((r) => r.next_review_at && new Date(r.next_review_at) <= new Date())
      .map((r) => r.topic_id)
  );

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const diffWeight = { hard: 3, medium: 2, easy: 1 };

  const stats = {};

  for (const orbit of orbits) {
    const orbitTopics = topics.filter((t) => t.orbit_id === orbit.id);
    const done = orbitTopics.filter((t) => t.status === 'done').length;
    const pending = orbitTopics.filter((t) => pendingReviewIds.has(t.id)).length;

    const score = orbitTopics
      .filter((t) => t.status !== 'done' || pendingReviewIds.has(t.id))
      .reduce((acc, t) => {
        const p = priorityWeight[orbit.priority] ?? 1;
        const d = diffWeight[t.difficulty] ?? 2;
        const bonus = pendingReviewIds.has(t.id) ? 5 : 0;
        return acc + p * d + bonus;
      }, 0);

    stats[orbit.id] = { total: orbitTopics.length, done, pending, score };
  }

  return stats;
}
