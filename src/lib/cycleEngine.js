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
 * Gera a fila do ciclo adaptativo a partir dos dados reais do banco.
 * Retorna array de tópicos enriquecidos, ordenados por score decrescente.
 * Exclui tópicos com status 'done' que não têm revisão pendente.
 */
export async function buildCycle() {
  const [orbits, topics, pendingReviews] = await Promise.all([
    getOrbits(),
    getTopics(),
    getReviews({ pending: true }),
  ]);

  const orbitMap = Object.fromEntries(orbits.map((o) => [o.id, o]));
  const pendingReviewIds = new Set(pendingReviews.map((r) => r.topic_id));

  const queue = topics
    .filter((t) => {
      // Inclui pendentes de revisão mesmo que 'done'
      if (pendingReviewIds.has(t.id)) return true;
      // Exclui tópicos já concluídos sem revisão pendente
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

  return queue;
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
 * Recebe os dados já carregados (orbits, topics, reviews)
 * e retorna stats por órbita: { [orbitId]: { total, done, pending, score } }
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

    // Score agregado da órbita (soma dos scores dos tópicos não concluídos)
    const score = orbitTopics
      .filter((t) => t.status !== 'done' || pendingReviewIds.has(t.id))
      .reduce((acc, t) => {
        const p = priorityWeight[orbit.priority] ?? 1;
        const d = diffWeight[t.difficulty] ?? 2;
        const bonus = pendingReviewIds.has(t.id) ? 5 : 0;
        return acc + p * d + bonus;
      }, 0);

    stats[orbit.id] = {
      total: orbitTopics.length,
      done,
      pending,
      score,
    };
  }

  return stats;
}
