// Data layer — abstracts Supabase calls, falls back to demo data
import { supabase, DEMO_MODE } from './supabase.js'
import {
  DEMO_ORBITS, DEMO_TOPICS, DEMO_SESSIONS, DEMO_REVIEWS
} from './demo.js'
import { calculateNextReview } from './cycleEngine.js'

// ── In-memory demo state (mutations while in demo mode) ──
let _orbits = [...DEMO_ORBITS]
let _topics = [...DEMO_TOPICS]
let _sessions = [...DEMO_SESSIONS]
let _reviews = [...DEMO_REVIEWS]

// ── Orbits ────────────────────────────────────────────────

export async function fetchOrbits() {
  if (DEMO_MODE) return { data: _orbits, error: null }
  return supabase.from('orbits').select('*').order('priority', { ascending: false })
}

export async function createOrbit(orbit) {
  const newOrbit = { ...orbit, id: `orbit-${Date.now()}`, created_at: new Date().toISOString() }
  if (DEMO_MODE) {
    _orbits = [..._orbits, newOrbit]
    return { data: newOrbit, error: null }
  }
  const { data, error } = await supabase.from('orbits').insert(orbit).select().maybeSingle()
  return { data, error }
}

export async function updateOrbit(id, updates) {
  if (DEMO_MODE) {
    _orbits = _orbits.map(o => o.id === id ? { ...o, ...updates } : o)
    return { data: _orbits.find(o => o.id === id), error: null }
  }
  return supabase.from('orbits').update(updates).eq('id', id).select().maybeSingle()
}

export async function deleteOrbit(id) {
  if (DEMO_MODE) {
    _orbits = _orbits.filter(o => o.id !== id)
    _topics = _topics.filter(t => t.orbit_id !== id)
    return { error: null }
  }
  return supabase.from('orbits').delete().eq('id', id)
}

// ── Topics ────────────────────────────────────────────────

export async function fetchTopics(orbitId = null) {
  if (DEMO_MODE) {
    const data = orbitId ? _topics.filter(t => t.orbit_id === orbitId) : _topics
    return { data, error: null }
  }
  let query = supabase.from('topics').select('*').order('order_idx')
  if (orbitId) query = query.eq('orbit_id', orbitId)
  return query
}

export async function createTopic(topic) {
  const newTopic = { ...topic, id: `topic-${Date.now()}`, created_at: new Date().toISOString() }
  if (DEMO_MODE) {
    _topics = [..._topics, newTopic]
    return { data: newTopic, error: null }
  }
  const { data, error } = await supabase.from('topics').insert(topic).select().maybeSingle()
  return { data, error }
}

export async function bulkCreateTopics(topics) {
  if (DEMO_MODE) {
    const newTopics = topics.map((t, i) => ({
      ...t,
      id: `topic-${Date.now()}-${i}`,
      created_at: new Date().toISOString()
    }))
    _topics = [..._topics, ...newTopics]
    return { data: newTopics, error: null }
  }
  const { data, error } = await supabase.from('topics').insert(topics).select()
  return { data, error }
}

export async function updateTopic(id, updates) {
  if (DEMO_MODE) {
    _topics = _topics.map(t => t.id === id ? { ...t, ...updates } : t)
    return { data: _topics.find(t => t.id === id), error: null }
  }
  return supabase.from('topics').update(updates).eq('id', id).select().maybeSingle()
}

// ── Sessions ──────────────────────────────────────────────

export async function fetchSessions(limit = 50) {
  if (DEMO_MODE) return { data: _sessions.slice(0, limit), error: null }
  return supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function createSession(session) {
  const newSession = { ...session, id: `session-${Date.now()}`, created_at: new Date().toISOString() }
  if (DEMO_MODE) {
    _sessions = [newSession, ..._sessions]
    return { data: newSession, error: null }
  }
  const { data, error } = await supabase.from('sessions').insert(session).select().maybeSingle()
  return { data, error }
}

// ── Reviews ───────────────────────────────────────────────

export async function fetchReviews() {
  if (DEMO_MODE) return { data: _reviews, error: null }
  return supabase.from('reviews').select('*').order('due_at')
}

export async function markReview(reviewId, difficulty) {
  const review = _reviews.find(r => r.id === reviewId) || { ease: 2.5, reps: 0 }
  const next = calculateNextReview({ ease: review.ease, reps: review.reps, difficulty })

  if (DEMO_MODE) {
    _reviews = _reviews.map(r =>
      r.id === reviewId ? { ...r, ...next } : r
    )
    return { data: { ...review, ...next }, error: null }
  }
  return supabase.from('reviews').update(next).eq('id', reviewId).select().maybeSingle()
}

export async function createReview(topicId, orbitId) {
  const review = {
    topic_id: topicId,
    orbit_id: orbitId,
    due_at: new Date(Date.now() + 86400000).toISOString(),
    interval_days: 1,
    ease: 2.5,
    reps: 0,
  }
  const newReview = { ...review, id: `review-${Date.now()}` }
  if (DEMO_MODE) {
    _reviews = [..._reviews, newReview]
    return { data: newReview, error: null }
  }
  const { data, error } = await supabase.from('reviews').insert(review).select().maybeSingle()
  return { data, error }
}

// ── All data (for cycle engine) ───────────────────────────

export async function fetchAllData() {
  const [orbitsRes, topicsRes, sessionsRes, reviewsRes] = await Promise.all([
    fetchOrbits(),
    fetchTopics(),
    fetchSessions(),
    fetchReviews(),
  ])
  return {
    orbits: orbitsRes.data || [],
    topics: topicsRes.data || [],
    sessions: sessionsRes.data || [],
    reviews: reviewsRes.data || [],
    error: orbitsRes.error || topicsRes.error || sessionsRes.error || reviewsRes.error,
  }
}
