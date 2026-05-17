// In-memory demo store — mirrors Supabase schema exactly
// Replaced by real Supabase calls when env vars are present

export const DEMO_ORBITS = [
  {
    id: 'orbit-1',
    name: 'Concurso Fiscal',
    description: 'RFB · TCU · SEFAZ-BA',
    color: '#b5813a',
    icon: 'orbit-rings',
    priority: 3,
    weekly_hours_goal: 14,
    created_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'orbit-2',
    name: 'Glaucoma',
    description: 'Clínica · Diagnóstico · Cirurgia',
    color: '#4a7c59',
    icon: 'node-cluster',
    priority: 2,
    weekly_hours_goal: 6,
    created_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'orbit-3',
    name: 'Oftalmologia Geral',
    description: 'Atualização clínica contínua',
    color: '#3a6a7a',
    icon: 'arc-open',
    priority: 2,
    weekly_hours_goal: 4,
    created_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'orbit-4',
    name: 'Fotografia',
    description: 'Retrato · Paisagem · Street',
    color: '#7a5a8a',
    icon: 'constellation',
    priority: 1,
    weekly_hours_goal: 2,
    created_at: '2025-01-10T00:00:00Z',
  },
]

export const DEMO_TOPICS = [
  // Concurso Fiscal
  { id: 't1', orbit_id: 'orbit-1', title: 'Contabilidade Geral', subtitle: 'Balanços e demonstrações', weight: 18, status: 'in_progress', difficulty: 'hard', order_idx: 1 },
  { id: 't2', orbit_id: 'orbit-1', title: 'Direito Tributário', subtitle: 'CTN e espécies tributárias', weight: 15, status: 'pending', difficulty: 'hard', order_idx: 2 },
  { id: 't3', orbit_id: 'orbit-1', title: 'Direito Administrativo', subtitle: 'Atos e processos', weight: 12, status: 'pending', difficulty: 'medium', order_idx: 3 },
  { id: 't4', orbit_id: 'orbit-1', title: 'Raciocínio Lógico', subtitle: 'Lógica proposicional', weight: 10, status: 'done', difficulty: 'medium', order_idx: 4 },
  { id: 't5', orbit_id: 'orbit-1', title: 'Português', subtitle: 'Compreensão e redação', weight: 10, status: 'done', difficulty: 'easy', order_idx: 5 },
  { id: 't6', orbit_id: 'orbit-1', title: 'Direito Constitucional', subtitle: 'Princípios fundamentais', weight: 8, status: 'in_progress', difficulty: 'medium', order_idx: 6 },
  // Glaucoma
  { id: 't7', orbit_id: 'orbit-2', title: 'Pressão intraocular', subtitle: 'Mecanismos e medição', weight: 20, status: 'done', difficulty: 'medium', order_idx: 1 },
  { id: 't8', orbit_id: 'orbit-2', title: 'Trabeculoplastia SLT', subtitle: 'Indicações e técnica', weight: 15, status: 'done', difficulty: 'medium', order_idx: 2 },
  { id: 't9', orbit_id: 'orbit-2', title: 'Campo visual', subtitle: 'Interpretação e progressão', weight: 18, status: 'in_progress', difficulty: 'hard', order_idx: 3 },
  { id: 't10', orbit_id: 'orbit-2', title: 'ONH e RNFL', subtitle: 'Análise estrutural', weight: 16, status: 'in_progress', difficulty: 'hard', order_idx: 4 },
]

export const DEMO_SESSIONS = [
  { id: 's1', orbit_id: 'orbit-1', topic_id: 't1', duration_sec: 2880, difficulty_after: 'hard', notes: '', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 's2', orbit_id: 'orbit-2', topic_id: 't8', duration_sec: 1320, difficulty_after: 'easy', notes: '', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 's3', orbit_id: 'orbit-1', topic_id: 't6', duration_sec: 3300, difficulty_after: 'medium', notes: '', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 's4', orbit_id: 'orbit-2', topic_id: 't9', duration_sec: 2100, difficulty_after: 'hard', notes: '', created_at: new Date(Date.now() - 90000000).toISOString() },
]

export const DEMO_REVIEWS = [
  { id: 'r1', topic_id: 't1', orbit_id: 'orbit-1', due_at: new Date().toISOString(), interval_days: 1, ease: 2.1, reps: 2 },
  { id: 'r2', topic_id: 't6', orbit_id: 'orbit-1', due_at: new Date().toISOString(), interval_days: 1, ease: 2.5, reps: 1 },
  { id: 'r3', topic_id: 't9', orbit_id: 'orbit-2', due_at: new Date().toISOString(), interval_days: 7, ease: 1.8, reps: 3 },
  { id: 'r4', topic_id: 't8', orbit_id: 'orbit-2', due_at: new Date(Date.now() + 86400000).toISOString(), interval_days: 30, ease: 2.8, reps: 5 },
]

// Spaced repetition intervals (days) by difficulty rating
export const SM2_INTERVALS = {
  forgot:  { next: 1,  ease_delta: -0.3 },
  hard:    { next: 1,  ease_delta: -0.15 },
  medium:  { next: 6,  ease_delta: 0 },
  easy:    { next: 14, ease_delta: 0.15 },
}

export const ORBIT_ICONS = [
  // Set 1 — orbital / astronomical
  { id: 'orbit-rings',   label: 'Órbita' },
  { id: 'arc-open',      label: 'Arco' },
  { id: 'meridian',      label: 'Meridiano' },
  { id: 'compass',       label: 'Bússola' },
  // Set 2 — nodes / networks
  { id: 'node-cluster',  label: 'Nós' },
  { id: 'constellation', label: 'Constelação' },
  { id: 'radial',        label: 'Radial' },
  { id: 'branch',        label: 'Ramificação' },
  // Set 3 — flows / motion
  { id: 'wave-flow',     label: 'Onda' },
  { id: 'helix',         label: 'Hélice' },
  { id: 'spiral',        label: 'Espiral' },
  { id: 'loop-open',     label: 'Loop' },
  // Set 4 — structure / geometry
  { id: 'prism',         label: 'Prisma' },
  { id: 'delta',         label: 'Delta' },
  { id: 'diamond',       label: 'Diamante' },
  { id: 'grid-break',    label: 'Grade' },
  // Set 5 — depth / layers
  { id: 'lens',          label: 'Lente' },
  { id: 'strata',        label: 'Estratos' },
  { id: 'parallax',      label: 'Paralaxe' },
  { id: 'anchor',        label: 'Âncora' },
]
