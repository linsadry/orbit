import { supabase, DEMO_MODE } from './supabase.js';
import { DEMO_ORBITS, DEMO_TOPICS, DEMO_SESSIONS, DEMO_REVIEWS } from './demo.js';

// ─── ORBITS ──────────────────────────────────────────────────────────────────

export async function getOrbits() {
  if (DEMO_MODE) return DEMO_ORBITS;
  const { data, error } = await supabase
    .from('orbits')
    .select('*')
    .order('priority', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createOrbit(orbit) {
  if (DEMO_MODE) return { ...orbit, id: crypto.randomUUID() };
  const { data, error } = await supabase
    .from('orbits')
    .insert(orbit)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOrbit(id, updates) {
  if (DEMO_MODE) return { id, ...updates };
  const { data, error } = await supabase
    .from('orbits')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteOrbit(id) {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('orbits').delete().eq('id', id);
  if (error) throw error;
}

// ─── TOPICS ──────────────────────────────────────────────────────────────────

export async function getTopics(orbitId = null) {
  if (DEMO_MODE) {
    return orbitId
      ? DEMO_TOPICS.filter((t) => t.orbit_id === orbitId)
      : DEMO_TOPICS;
  }
  let query = supabase.from('topics').select('*').order('created_at');
  if (orbitId) query = query.eq('orbit_id', orbitId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTopic(topic) {
  if (DEMO_MODE) return { ...topic, id: crypto.randomUUID() };
  const { data, error } = await supabase
    .from('topics')
    .insert(topic)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateTopic(id, updates) {
  if (DEMO_MODE) return { id, ...updates };
  const { data, error } = await supabase
    .from('topics')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteTopic(id) {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkCreateTopics(topics) {
  if (DEMO_MODE) return topics.map((t) => ({ ...t, id: crypto.randomUUID() }));
  const results = [];
  for (const topic of topics) {
    const { data, error } = await supabase
      .from('topics')
      .insert(topic)
      .select()
      .maybeSingle();
    if (error) throw error;
    results.push(data);
  }
  return results;
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export async function getSessions({ orbitId, limit, since } = {}) {
  if (DEMO_MODE) {
    let s = DEMO_SESSIONS;
    if (orbitId) s = s.filter((x) => x.orbit_id === orbitId);
    if (since) s = s.filter((x) => new Date(x.started_at) >= new Date(since));
    return limit ? s.slice(0, limit) : s;
  }
  let query = supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });
  if (orbitId) query = query.eq('orbit_id', orbitId);
  if (since) query = query.gte('started_at', since);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Salva uma sessão de estudo ao encerrar o timer.
 * @param {object} session
 * @param {string} session.orbit_id
 * @param {string|null} session.topic_id
 * @param {string} session.started_at   — ISO string
 * @param {number} session.duration_sec — segundos efetivos (descontando pausas)
 * @param {string} [session.notes]
 */
export async function saveSession(session) {
  if (DEMO_MODE) return { ...session, id: crypto.randomUUID() };
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      orbit_id: session.orbit_id,
      topic_id: session.topic_id ?? null,
      started_at: session.started_at,
      duration_sec: session.duration_sec,
      notes: session.notes ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export async function getReviews({ topicId, pending } = {}) {
  if (DEMO_MODE) {
    let r = DEMO_REVIEWS;
    if (topicId) r = r.filter((x) => x.topic_id === topicId);
    if (pending) r = r.filter((x) => new Date(x.next_review_at) <= new Date());
    return r;
  }
  let query = supabase.from('reviews').select('*').order('next_review_at');
  if (topicId) query = query.eq('topic_id', topicId);
  if (pending) query = query.lte('next_review_at', new Date().toISOString());
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertReview(topicId, rating) {
  if (DEMO_MODE) return;
  const intervals = { easy: 30, medium: 7, hard: 1, forgot: 1 };
  const days = intervals[rating] ?? 7;
  const next = new Date();
  next.setDate(next.getDate() + days);

  const { error } = await supabase.from('reviews').upsert(
    {
      topic_id: topicId,
      last_review_at: new Date().toISOString(),
      next_review_at: next.toISOString(),
      last_rating: rating,
    },
    { onConflict: 'topic_id' }
  );
  if (error) throw error;
}

// ─── DASHBOARD AGGREGATES ─────────────────────────────────────────────────────

/**
 * Retorna dados agregados para o Dashboard em uma única chamada.
 */
export async function getDashboardStats() {
  if (DEMO_MODE) {
    const totalTopics = DEMO_TOPICS.length;
    const doneTopics = DEMO_TOPICS.filter((t) => t.status === 'done').length;
    const todayMs = Date.now();
    const weekAgo = new Date(todayMs - 7 * 86400000).toISOString();
    const weekSessions = DEMO_SESSIONS.filter(
      (s) => s.started_at >= weekAgo
    );
    const weekSeconds = weekSessions.reduce(
      (acc, s) => acc + (s.duration_sec ?? 0),
      0
    );
    const pendingReviews = DEMO_REVIEWS.filter(
      (r) => new Date(r.next_review_at) <= new Date()
    ).length;
    return {
      totalTopics,
      doneTopics,
      progressPct: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0,
      weekHours: +(weekSeconds / 3600).toFixed(1),
      weekSessions: weekSessions.length,
      pendingReviews,
      streak: 3, // demo fixo
    };
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [topicsRes, sessionsRes, reviewsRes] = await Promise.all([
    supabase.from('topics').select('id, status'),
    supabase
      .from('sessions')
      .select('duration_sec, started_at')
      .gte('started_at', weekAgo),
    supabase
      .from('reviews')
      .select('next_review_at')
      .lte('next_review_at', new Date().toISOString()),
  ]);

  if (topicsRes.error) throw topicsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;

  const topics = topicsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const totalTopics = topics.length;
  const doneTopics = topics.filter((t) => t.status === 'done').length;
  const weekSeconds = sessions.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);

  // Calcular streak: dias consecutivos com sessão
  const streak = await calcStreak();

  return {
    totalTopics,
    doneTopics,
    progressPct: totalTopics
      ? Math.round((doneTopics / totalTopics) * 100)
      : 0,
    weekHours: +(weekSeconds / 3600).toFixed(1),
    weekSessions: sessions.length,
    pendingReviews: reviewsRes.data?.length ?? 0,
    streak,
  };
}

async function calcStreak() {
  const { data, error } = await supabase
    .from('sessions')
    .select('started_at')
    .order('started_at', { ascending: false })
    .limit(90);
  if (error || !data?.length) return 0;

  const days = [
    ...new Set(data.map((s) => s.started_at.slice(0, 10))),
  ].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;

  for (const day of days) {
    if (day === cursor) {
      streak++;
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

// ─── MÉTRICAS ─────────────────────────────────────────────────────────────────

/**
 * Horas de estudo por órbita nos últimos N dias.
 */
export async function getHoursByOrbit(days = 30) {
  if (DEMO_MODE) {
    const map = {};
    for (const s of DEMO_SESSIONS) {
      map[s.orbit_id] = (map[s.orbit_id] ?? 0) + (s.duration_sec ?? 0);
    }
    return Object.entries(map).map(([orbit_id, sec]) => ({
      orbit_id,
      hours: +(sec / 3600).toFixed(1),
    }));
  }
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select('orbit_id, duration_sec')
    .gte('started_at', since);
  if (error) throw error;
  const map = {};
  for (const s of data ?? []) {
    map[s.orbit_id] = (map[s.orbit_id] ?? 0) + (s.duration_sec ?? 0);
  }
  return Object.entries(map).map(([orbit_id, sec]) => ({
    orbit_id,
    hours: +(sec / 3600).toFixed(1),
  }));
}

/**
 * Horas de estudo por dia nos últimos N dias (para gráfico de linha).
 */
export async function getDailyHours(days = 14) {
  if (DEMO_MODE) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      return {
        date: d.toISOString().slice(0, 10),
        hours: +(Math.random() * 3).toFixed(1),
      };
    });
  }
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select('started_at, duration_sec')
    .gte('started_at', since);
  if (error) throw error;
  const map = {};
  for (const s of data ?? []) {
    const day = s.started_at.slice(0, 10);
    map[day] = (map[day] ?? 0) + (s.duration_sec ?? 0);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const date = d.toISOString().slice(0, 10);
    return { date, hours: +((map[date] ?? 0) / 3600).toFixed(1) };
  });
}

/**
 * Progresso de tópicos por órbita (done / total).
 */
export async function getProgressByOrbit() {
  if (DEMO_MODE) {
    const map = {};
    for (const t of DEMO_TOPICS) {
      if (!map[t.orbit_id]) map[t.orbit_id] = { total: 0, done: 0 };
      map[t.orbit_id].total++;
      if (t.status === 'done') map[t.orbit_id].done++;
    }
    return map;
  }
  const { data, error } = await supabase
    .from('topics')
    .select('orbit_id, status');
  if (error) throw error;
  const map = {};
  for (const t of data ?? []) {
    if (!map[t.orbit_id]) map[t.orbit_id] = { total: 0, done: 0 };
    map[t.orbit_id].total++;
    if (t.status === 'done') map[t.orbit_id].done++;
  }
  return map;
}

// ─── MAPA (CONSTELAÇÃO) ───────────────────────────────────────────────────────

/**
 * Dados completos para o mapa visual:
 * órbitas + tópicos + progresso + horas recentes.
 */
export async function getMapData() {
  if (DEMO_MODE) {
    const progressMap = {};
    const hoursMap = {};
    for (const t of DEMO_TOPICS) {
      if (!progressMap[t.orbit_id]) progressMap[t.orbit_id] = { total: 0, done: 0 };
      progressMap[t.orbit_id].total++;
      if (t.status === 'done') progressMap[t.orbit_id].done++;
    }
    for (const s of DEMO_SESSIONS) {
      hoursMap[s.orbit_id] = (hoursMap[s.orbit_id] ?? 0) + (s.duration_sec ?? 0);
    }
    return DEMO_ORBITS.map((o) => ({
      ...o,
      topics: DEMO_TOPICS.filter((t) => t.orbit_id === o.id),
      progress: progressMap[o.id] ?? { total: 0, done: 0 },
      recentHours: +((hoursMap[o.id] ?? 0) / 3600).toFixed(1),
    }));
  }

  const [orbitsRes, topicsRes, sessionsRes] = await Promise.all([
    supabase.from('orbits').select('*').order('priority', { ascending: false }),
    supabase.from('topics').select('*'),
    supabase
      .from('sessions')
      .select('orbit_id, duration_sec')
      .gte('started_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  if (orbitsRes.error) throw orbitsRes.error;
  if (topicsRes.error) throw topicsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const topics = topicsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  const progressMap = {};
  for (const t of topics) {
    if (!progressMap[t.orbit_id]) progressMap[t.orbit_id] = { total: 0, done: 0 };
    progressMap[t.orbit_id].total++;
    if (t.status === 'done') progressMap[t.orbit_id].done++;
  }

  const hoursMap = {};
  for (const s of sessions) {
    hoursMap[s.orbit_id] = (hoursMap[s.orbit_id] ?? 0) + (s.duration_sec ?? 0);
  }

  return (orbitsRes.data ?? []).map((o) => ({
    ...o,
    topics: topics.filter((t) => t.orbit_id === o.id),
    progress: progressMap[o.id] ?? { total: 0, done: 0 },
    recentHours: +((hoursMap[o.id] ?? 0) / 3600).toFixed(1),
  }));
}
