// OrbitasPage.jsx
import { useState } from 'react'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'
import { ORBIT_ICONS } from '../lib/demo.js'
import { createOrbit, updateTopic, createTopic, deleteTopic, deleteOrbit, updateOrbit } from '../lib/db.js'
import { computeOrbitStats } from '../lib/cycleEngine.js'

export function OrbitasPage({ data, onNavigate, notify, onRefresh }) {
  const { orbits = [], topics = [], sessions = [] } = data
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('#b5813a')
  const [newIcon, setNewIcon] = useState('orbit-rings')
  const [newPriority, setNewPriority] = useState(2)
  const [saving, setSaving] = useState(false)
  const [selectedOrbit, setSelectedOrbit] = useState(null)

  // Topic form state
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicSub, setTopicSub] = useState('')
  const [topicWeight, setTopicWeight] = useState(10)
  const [topicDiff, setTopicDiff] = useState('medium')
  const [topicHours, setTopicHours] = useState(2)
  const [savingTopic, setSavingTopic] = useState(false)
  const [editingOrbit, setEditingOrbit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editPriority, setEditPriority] = useState(2)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const { data: created, error } = await createOrbit({ name: newName, description: newDesc, color: newColor, icon: newIcon, priority: newPriority, weekly_hours_goal: 4 })
      if (error) {
        notify('Erro ao criar órbita: ' + (error.message || JSON.stringify(error)), 'error')
        console.error('[Orbit] createOrbit error:', error)
      } else {
        notify('Órbita criada!')
        onRefresh()
        setShowNew(false)
        setNewName(''); setNewDesc('')
      }
    } catch (err) {
      notify('Erro inesperado: ' + err.message, 'error')
      console.error('[Orbit] createOrbit exception:', err)
    }
    setSaving(false)
  }

  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }
  const inputStyle = { padding: '8px 11px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none', width: '100%' }
  const COLORS = ['#b5813a', '#4a7c59', '#3a6a7a', '#7a5a8a', '#c47a5a', '#3a5a7a', '#6a7a3a', '#7a3a5a']

  const handleCreateTopic = async () => {
    if (!topicTitle.trim() || !selectedOrbit) return
    setSavingTopic(true)
    try {
      const { error } = await createTopic({
        orbit_id: selectedOrbit.id,
        title: topicTitle.trim(),
        subtitle: topicSub.trim(),
        weight: parseInt(topicWeight),
        difficulty: topicDiff,
        estimated_hours: parseFloat(topicHours),
        status: 'pending',
        order_idx: topics.filter(t => t.orbit_id === selectedOrbit.id).length + 1,
      })
      if (error) {
        notify('Erro ao criar tópico: ' + (error.message || JSON.stringify(error)), 'error')
      } else {
        notify('Tópico adicionado!')
        setTopicTitle(''); setTopicSub(''); setTopicWeight(10); setTopicDiff('medium'); setTopicHours(2)
        setShowNewTopic(false)
        onRefresh()
      }
    } catch (err) {
      notify('Erro: ' + err.message, 'error')
    }
    setSavingTopic(false)
  }

  const handleTopicStatus = async (topicId, status) => {
    await updateTopic(topicId, { status })
    onRefresh()
  }

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Remover este tópico?')) return
    await deleteTopic(topicId)
    onRefresh()
  }

  const handleDeleteOrbit = async (orbitId) => {
    if (!window.confirm('Excluir esta órbita e todos os seus tópicos? Esta ação não pode ser desfeita.')) return
    await deleteOrbit(orbitId)
    setSelectedOrbit(null)
    onRefresh()
    notify('Órbita excluída.')
  }

  const handleSaveOrbitEdit = async () => {
    if (!selectedOrbit) return
    await updateOrbit(selectedOrbit.id, { name: editName, description: editDesc, color: editColor, priority: editPriority })
    setEditingOrbit(false)
    onRefresh()
    notify('Órbita atualizada.')
  }

  const openEditOrbit = (orbit) => {
    setEditName(orbit.name)
    setEditDesc(orbit.description || '')
    setEditColor(orbit.color)
    setEditPriority(orbit.priority || 2)
    setEditingOrbit(true)
  }

  // If an orbit is selected, show its detail view
  if (selectedOrbit) {
    const orbit = orbits.find(o => o.id === selectedOrbit.id) || selectedOrbit
    const orbitTopics = topics.filter(t => t.orbit_id === orbit.id)
    const diffLabel = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
    const diffColor = { easy: '#4a7c59', medium: '#b5813a', hard: '#c47a5a' }
    const statusLabel = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' }

    return (
      <div>
        <div style={{ padding: '18px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
          <button style={{ padding: '6px 12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => { setSelectedOrbit(null); setShowNewTopic(false) }}>← Voltar</button>
          <OrbitIcon id={orbit.icon} size={18} color={orbit.color} />
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>{orbit.name}</div>
          {orbit.description && <div style={{ fontSize: 12, color: C.text3 }}>· {orbit.description}</div>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={{ padding: '7px 14px', background: `${orbit.color}18`, border: `1px solid ${orbit.color}44`, borderRadius: 8, color: orbit.color, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNewTopic(true)}>+ Novo tópico</button>
            <button style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => openEditOrbit(orbit)}>Editar</button>
            <button style={{ padding: '7px 12px', background: 'rgba(196,122,90,0.08)', border: '1px solid rgba(196,122,90,0.25)', borderRadius: 8, color: '#c47a5a', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => handleDeleteOrbit(orbit.id)}>Excluir</button>
            <button style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => onNavigate('importar')}>↑ PDF</button>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Priority config */}
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Prioridade da órbita</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ v: 1, l: 'Baixa' }, { v: 2, l: 'Média' }, { v: 3, l: 'Alta' }].map(p => (
                  <button key={p.v} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${orbit.priority === p.v ? orbit.color + '88' : C.border}`, background: orbit.priority === p.v ? orbit.color + '18' : 'none', color: orbit.priority === p.v ? orbit.color : C.text3, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }}
                    onClick={async () => { await updateTopic(orbit.id, { priority: p.v }); onRefresh() }}>{p.l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Tópicos</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: C.text }}>{orbitTopics.length}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Concluídos</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: orbit.color }}>{orbitTopics.filter(t => t.status === 'done').length}</div>
            </div>
          </div>

          {/* Edit orbit form */}
          {editingOrbit && (
            <div style={{ background: C.bg2, border: `1px solid ${orbit.color}33`, borderRadius: 12, padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 14 }}>Editar órbita</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>Nome</div>
                  <input style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>Descrição</div>
                  <input style={inputStyle} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: C.text3, marginRight: 4 }}>Cor:</div>
                {COLORS.map(c => (
                  <button key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }} onClick={() => setEditColor(c)} />
                ))}
                <div style={{ marginLeft: 16, fontSize: 11, color: C.text3, marginRight: 4 }}>Prioridade:</div>
                {[{ v: 1, l: 'Baixa' }, { v: 2, l: 'Média' }, { v: 3, l: 'Alta' }].map(p => (
                  <button key={p.v} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${editPriority === p.v ? orbit.color + '88' : C.border}`, background: editPriority === p.v ? orbit.color + '18' : 'none', color: editPriority === p.v ? orbit.color : C.text3, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setEditPriority(p.v)}>{p.l}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 18px', background: `${orbit.color}18`, border: `1px solid ${orbit.color}44`, borderRadius: 8, color: orbit.color, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={handleSaveOrbitEdit}>Salvar</button>
                <button style={{ padding: '8px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setEditingOrbit(false)}>Cancelar</button>
              </div>
            </div>
          )}
          {showNewTopic && (
            <div style={{ background: C.bg2, border: `1px solid ${orbit.color}33`, borderRadius: 12, padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 14 }}>Novo tópico</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <input style={inputStyle} placeholder="Nome do tópico *" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} />
                <input style={inputStyle} placeholder="Subtítulo (opcional)" value={topicSub} onChange={e => setTopicSub(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>Peso (1–30) — importância no ciclo</div>
                  <input type="number" min="1" max="30" style={inputStyle} value={topicWeight} onChange={e => setTopicWeight(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>Dificuldade</div>
                  <select style={inputStyle} value={topicDiff} onChange={e => setTopicDiff(e.target.value)}>
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>Horas estimadas</div>
                  <input type="number" min="0.5" step="0.5" style={inputStyle} value={topicHours} onChange={e => setTopicHours(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 18px', background: `${orbit.color}18`, border: `1px solid ${orbit.color}44`, borderRadius: 8, color: orbit.color, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={handleCreateTopic} disabled={savingTopic}>{savingTopic ? 'Salvando...' : 'Adicionar tópico'}</button>
                <button style={{ padding: '8px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNewTopic(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Topics list */}
          {orbitTopics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.text3, fontSize: 13 }}>
              <div style={{ marginBottom: 8 }}>Nenhum tópico ainda</div>
              <div style={{ fontSize: 12 }}>Adicione tópicos manualmente ou importe um PDF/edital</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orbitTopics.map(topic => (
                <div key={topic.id} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: topic.status === 'done' ? orbit.color : topic.status === 'in_progress' ? orbit.color + '88' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: C.text, fontWeight: 500 }}>{topic.title}</div>
                    {topic.subtitle && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{topic.subtitle}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: diffColor[topic.difficulty] || C.text3, padding: '2px 7px', border: `1px solid ${diffColor[topic.difficulty]}44`, borderRadius: 99 }}>{diffLabel[topic.difficulty]}</span>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: "'Geist Mono', monospace" }}>peso {topic.weight}</span>
                    <span style={{ fontSize: 11, color: C.text3, fontFamily: "'Geist Mono', monospace" }}>{topic.estimated_hours}h</span>
                    <select style={{ ...inputStyle, padding: '4px 8px', fontSize: 11, width: 'auto' }} value={topic.status} onChange={e => handleTopicStatus(topic.id, e.target.value)}>
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluído</option>
                    </select>
                    <button onClick={() => handleDeleteTopic(topic.id)} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(196,122,90,0.08)', border: '1px solid rgba(196,122,90,0.2)', borderRadius: 6, color: '#c47a5a', cursor: 'pointer', fontSize: 12, flexShrink: 0 }} title="Remover tópico">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Órbitas</div>
        <button style={{ padding: '8px 16px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNew(true)}>
          + Nova órbita
        </button>
      </div>
      <div style={{ padding: '28px 32px' }}>
        {showNew && (
          <div style={{ background: C.bg2, border: '1px solid rgba(181,129,58,0.2)', borderRadius: 14, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 18 }}>Nova órbita</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <input style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none' }} placeholder="Nome da órbita" value={newName} onChange={e => setNewName(e.target.value)} />
              <input style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none' }} placeholder="Descrição (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {COLORS.map(c => <button key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }} onClick={() => setNewColor(c)} />)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ORBIT_ICONS.map(icon => (
                <button key={icon.id} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${newIcon === icon.id ? 'rgba(181,129,58,0.4)' : C.border}`, borderRadius: 8, background: newIcon === icon.id ? 'rgba(181,129,58,0.08)' : 'none', cursor: 'pointer' }} onClick={() => setNewIcon(icon.id)} title={icon.label}>
                  <OrbitIcon id={icon.id} size={18} color={newColor} strokeWidth={1.4} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ padding: '9px 20px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Criando...' : 'Criar órbita'}
              </button>
              <button style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setShowNew(false)}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {orbits.map(orbit => {
            const stats = computeOrbitStats(orbit.id, topics, sessions)
            const orbitTopics = topics.filter(t => t.orbit_id === orbit.id)
            return (
              <div key={orbit.id} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 3, background: orbit.color, opacity: 0.6 }} />
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <OrbitIcon id={orbit.icon} size={20} color={orbit.color} />
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: C.text }}>{orbit.name}</div>
                  </div>
                  {orbit.description && <div style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>{orbit.description}</div>}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>tópicos</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text }}>{stats.totalTopics}</div></div>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>horas</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text }}>{stats.totalHours}</div></div>
                    <div><div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>domínio</div><div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: orbit.color }}>{stats.pct}%</div></div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', width: `${stats.pct}%`, background: orbit.color, borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflow: 'hidden' }}>
                    {orbitTopics.slice(0, 3).map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text2 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.status === 'done' ? orbit.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                        {t.title}
                      </div>
                    ))}
                    {orbitTopics.length > 3 && <div style={{ fontSize: 11, color: C.text3 }}>+{orbitTopics.length - 3} tópicos</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => setSelectedOrbit(orbit)}>⚙ Gerenciar</button>
                    <button style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => onNavigate('ciclo')}>▶ Estudar</button>
                    <button style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => onNavigate('importar')}>↑ PDF</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// RevisoesPage.jsx
export function RevisoesPage({ data, notify, onRefresh }) {
  const { reviews = [], topics = [], orbits = [] } = data
  const today = new Date()
  const overdue = reviews.filter(r => new Date(r.due_at) <= today)
  const upcoming = reviews.filter(r => new Date(r.due_at) > today)
  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

  const handleMark = async (reviewId, difficulty) => {
    const { markReview } = await import('../lib/db.js')
    await markReview(reviewId, difficulty)
    const labels = { easy: 'Próxima em 14 dias', medium: 'Próxima em 6 dias', hard: 'Próxima em 1 dia', forgot: 'Revisão amanhã' }
    notify(labels[difficulty] || 'Revisão registrada')
    onRefresh()
  }

  const ReviewCard = ({ r }) => {
    const topic = topics.find(t => t.id === r.topic_id)
    const orbit = orbits.find(o => o.id === r.orbit_id)
    return (
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: orbit?.color || '#888', flexShrink: 0 }} />
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{topic?.title || 'Revisão'}</div>
          <div style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>{orbit?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ k: 'easy', l: 'Fácil', c: '#4a7c59' }, { k: 'medium', l: 'Médio', c: '#b5813a' }, { k: 'hard', l: 'Difícil', c: '#c47a5a' }, { k: 'forgot', l: 'Esqueci', c: '#7a5a8a' }].map(d => (
            <button key={d.k} style={{ flex: 1, padding: '8px', border: `1px solid ${d.c}44`, borderRadius: 8, background: 'transparent', color: d.c, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" }} onClick={() => handleMark(r.id, d.k)}>{d.l}</button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Revisões</div>
      </div>
      <div style={{ padding: '28px 32px', maxWidth: 640 }}>
        {overdue.length > 0 && <>
          <div style={{ fontSize: 10.5, color: '#c47a5a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Pendentes hoje ({overdue.length})</div>
          {overdue.map(r => <ReviewCard key={r.id} r={r} />)}
        </>}
        {upcoming.length > 0 && <>
          <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 24 }}>Próximas revisões</div>
          {upcoming.slice(0, 5).map(r => {
            const topic = topics.find(t => t.id === r.topic_id)
            const orbit = orbits.find(o => o.id === r.orbit_id)
            const daysLeft = Math.ceil((new Date(r.due_at) - today) / 86400000)
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, opacity: 0.7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: orbit?.color || '#888' }} />
                <div style={{ flex: 1, fontSize: 13, color: C.text }}>{topic?.title}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>em {daysLeft}d</div>
              </div>
            )
          })}
        </>}
        {overdue.length === 0 && upcoming.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.text3, fontSize: 14 }}>Nenhuma revisão agendada ainda</div>
        )}
      </div>
    </div>
  )
}

// MapaPage.jsx
export function MapaPage({ data }) {
  const { orbits = [], topics = [] } = data
  const C = { border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text3: '#4e4a42' }

  const nodeData = topics.slice(0, 18).map((t, i) => {
    const orbit = orbits.find(o => o.id === t.orbit_id)
    const angle = (i / 18) * Math.PI * 2 - Math.PI / 2
    const radius = 80 + (i % 3) * 40
    return {
      x: 340 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle) * 0.6,
      label: t.title,
      color: orbit?.color || '#888',
      size: t.weight ? Math.max(4, Math.min(12, t.weight / 3)) : 6,
      status: t.status,
    }
  })

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Mapa de conhecimento</div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ background: '#131310', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', height: 420 }}>
          <svg width="100%" height="100%" viewBox="0 0 680 420">
            {nodeData.map((n, i) =>
              nodeData.slice(i + 1, i + 3).map((m, j) => (
                <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))
            )}
            {nodeData.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={n.size + 5} fill={n.color} opacity="0.07" />
                <circle cx={n.x} cy={n.y} r={n.size} fill={n.color} opacity={n.status === 'done' ? 0.9 : 0.35} />
                <text x={n.x} y={n.y + n.size + 13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="Geist, system-ui">
                  {n.label.length > 16 ? n.label.slice(0, 14) + '…' : n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {orbits.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.text3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color }} />
              {o.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// MetricasPage.jsx
export function MetricasPage({ data, sessions = [] }) {
  const { orbits = [], topics = [] } = data
  const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

  const totalSec = sessions.reduce((s, sess) => s + (sess.duration_sec || 0), 0)
  const totalHours = (totalSec / 3600).toFixed(1)
  const donePct = topics.length ? Math.round((topics.filter(t => t.status === 'done').length / topics.length) * 100) : 0

  const orbitHours = orbits.map(o => ({
    ...o,
    hours: sessions.filter(s => s.orbit_id === o.id).reduce((sum, s) => sum + (s.duration_sec || 0), 0) / 3600,
  }))
  const maxHours = Math.max(...orbitHours.map(o => o.hours), 1)

  return (
    <div>
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text }}>Métricas</div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total acumulado', value: `${totalHours}h`, sub: 'todas as órbitas' },
            { label: 'Tópicos dominados', value: `${donePct}%`, sub: `${topics.filter(t => t.status === 'done').length} de ${topics.length}` },
            { label: 'Sessões realizadas', value: sessions.length, sub: 'registradas no app' },
          ].map(c => (
            <div key={c.label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
          <div style={{ fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 }}>Distribuição por órbita</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orbitHours.map(o => (
              <div key={o.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.text2, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OrbitIcon id={o.icon} size={14} color={o.color} />
                    {o.name}
                  </span>
                  <span style={{ color: C.text, fontWeight: 500 }}>{o.hours.toFixed(1)}h</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(o.hours / maxHours) * 100}%`, background: o.color, borderRadius: 99, opacity: 0.8, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
