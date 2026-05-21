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
