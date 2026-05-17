// Adaptive Cycle Engine
// Hybrid model: user sets priorities, engine distributes and adapts
// SM-2 inspired spaced repetition + weight-based scheduling

import { SM2_INTERVALS } from './demo.js'

// ─── Core scheduling ───────────────────────────────────────────────

/**
 * Build daily cycle from orbits + topics + user config
 * Returns ordered array of CycleItem
 */
export function buildCycle({ orbits, topics, sessions, reviews, config = {} }) {
  const {
    dailyMinutes = 120,
    date = new Date(),
  } = config

  const todayStr = date.toISOString().split('T')[0]

  // 1. Separate overdue reviews (always first)
  const overdueReviews = reviews
    .filter(r => {
      const due = new Date(r.due_at)
      return due <= date
    })
    .map(r => {
      const topic = topics.find(t => t.id === r.topic_id)
      const orbit = orbits.find(o => o.id === r.orbit_id)
      return {
        type: 'review',
        id: `rev-${r.id}`,
        reviewId: r.id,
        topicId: r.topic_id,
        orbitId: r.orbit_id,
        title: topic?.title || 'Revisão',
        subtitle: topic?.subtitle || '',
        orbitName: orbit?.name || '',
        orbitColor: orbit?.color || '#888',
        orbitIcon: orbit?.icon || 'orbit-rings',
        estimatedMinutes: 15,
        priority: 10,
        ease: r.ease,
        reps: r.reps,
      }
    })

  // 2. Budget remaining time for new study
  const reviewMinutes = overdueReviews.length * 15
  const studyBudget = Math.max(30, dailyMinutes - reviewMinutes)

  // 3. Score topics by priority + weight + recency
  const topicsToStudy = topics
    .filter(t => t.status !== 'done')
    .map(t => {
      const orbit = orbits.find(o => o.id === t.orbit_id)
      if (!orbit) return null

      // Days since last session for this topic
      const lastSession = sessions
        .filter(s => s.topic_id === t.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      const daysSince = lastSession
        ? Math.floor((date - new Date(lastSession.created_at)) / 86400000)
        : 99

      // Score: orbit priority × topic weight × recency bonus
      const recencyBonus = Math.min(daysSince * 0.3, 3)
      const difficultyBonus = t.difficulty === 'hard' ? 1.4 : t.difficulty === 'medium' ? 1.1 : 0.9
      const score = (orbit.priority / 3) * (t.weight / 20) * difficultyBonus + recencyBonus

      const estimatedMinutes = t.difficulty === 'hard' ? 45 : t.difficulty === 'medium' ? 30 : 20

      return {
        type: 'study',
        id: `study-${t.id}`,
        topicId: t.id,
        orbitId: t.orbit_id,
        title: t.title,
        subtitle: t.subtitle,
        orbitName: orbit.name,
        orbitColor: orbit.color,
        orbitIcon: orbit.icon,
        estimatedMinutes,
        priority: score,
        weight: t.weight,
        difficulty: t.difficulty,
        status: t.status,
        daysSince,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority)

  // 4. Fill study budget
  const studyItems = []
  let remaining = studyBudget
  for (const item of topicsToStudy) {
    if (remaining <= 0) break
    studyItems.push(item)
    remaining -= item.estimatedMinutes
  }

  // 5. Combine: reviews first, then studies
  const cycle = [...overdueReviews, ...studyItems]

  return cycle
}

/**
 * Rebalance cycle when sessions are skipped/delayed
 * Call this at app start each day
 */
export function rebalanceCycle({ cycle, completedIds, totalMinutesLeft }) {
  const pending = cycle.filter(item => !completedIds.includes(item.id))
  const totalEstimated = pending.reduce((s, i) => s + i.estimatedMinutes, 0)

  if (totalEstimated <= totalMinutesLeft) return pending

  // Not enough time — prioritize by type (reviews first) then priority score
  let budget = totalMinutesLeft
  const result = []

  const reviews = pending.filter(i => i.type === 'review')
  const studies = pending.filter(i => i.type === 'study')

  for (const r of reviews) {
    if (budget >= r.estimatedMinutes) {
      result.push({ ...r, adjusted: false })
      budget -= r.estimatedMinutes
    } else {
      result.push({ ...r, adjusted: true, estimatedMinutes: budget })
      budget = 0
      break
    }
  }

  for (const s of studies) {
    if (budget <= 0) break
    if (budget >= s.estimatedMinutes) {
      result.push({ ...s, adjusted: false })
      budget -= s.estimatedMinutes
    } else if (budget >= 10) {
      result.push({ ...s, adjusted: true, estimatedMinutes: budget })
      budget = 0
    }
  }

  return result
}

/**
 * Calculate next review date using SM-2 algorithm
 */
export function calculateNextReview({ ease, reps, difficulty }) {
  const delta = SM2_INTERVALS[difficulty] || SM2_INTERVALS.medium
  const newEase = Math.max(1.3, ease + delta.ease_delta)

  let intervalDays
  if (reps === 0) intervalDays = 1
  else if (reps === 1) intervalDays = 6
  else intervalDays = Math.round((reps - 1) * newEase * delta.next)

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + intervalDays)

  return {
    interval_days: intervalDays,
    ease: newEase,
    reps: reps + 1,
    due_at: nextDate.toISOString(),
  }
}

/**
 * Compute orbit progress from topics
 */
export function computeOrbitStats(orbitId, topics, sessions) {
  const orbitTopics = topics.filter(t => t.orbit_id === orbitId)
  if (!orbitTopics.length) return { pct: 0, totalTopics: 0, doneTopics: 0, totalHours: 0 }

  const done = orbitTopics.filter(t => t.status === 'done').length
  const inProgress = orbitTopics.filter(t => t.status === 'in_progress').length
  const pct = Math.round(((done + inProgress * 0.5) / orbitTopics.length) * 100)

  const totalSec = sessions
    .filter(s => s.orbit_id === orbitId)
    .reduce((sum, s) => sum + (s.duration_sec || 0), 0)
  const totalHours = (totalSec / 3600).toFixed(1)

  return { pct, totalTopics: orbitTopics.length, doneTopics: done, totalHours }
}

/**
 * Weekly consistency: returns array of 7 values (hours/day)
 */
export function weeklyConsistency(sessions) {
  const days = Array(7).fill(0)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  for (const s of sessions) {
    const d = new Date(s.created_at)
    if (d >= weekStart) {
      const dayIdx = d.getDay()
      days[dayIdx] += s.duration_sec / 3600
    }
  }

  return days.map(h => Math.round(h * 10) / 10)
}
