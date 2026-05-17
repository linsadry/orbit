import { useState, useCallback } from 'react'
import { bulkCreateTopics, createOrbit } from '../lib/db.js'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'
import { ORBIT_ICONS } from '../lib/demo.js'

// ── Parser local — sem API, sem custo ─────────────────────────────────
function parseText(text, mode) {
  const topics = []

  if (mode === 'edital') {
    // Formato RFB: "Nome da Matéria: conteúdo..." ou "Nome da Matéria\nconteúdo"
    // Detecta linhas que são cabeçalhos de matéria:
    // - Terminam com ":" e têm conteúdo após
    // - Ou são linhas curtas (< 80 chars) que parecem nome de disciplina
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

    // Padrão 1: "Língua Portuguesa: Elementos de construção..."
    const inlineRx = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n:]{3,60}):\s+(.{20,})/

    // Padrão 2: linha curta que parece nome de matéria (sem ":" mas isolada)
    const standaloneRx = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç\s\-\/]+)$/

    // Ignorar linhas de estrutura do edital
    const ignore = /^(anexo|módulo|auditor|analista|edital|ministério|secretaria|concurso|fl\.|documento|cargo|vagas|carreira|DF\s)/i

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (ignore.test(line)) continue

      const m1 = line.match(inlineRx)
      if (m1) {
        const name = m1[1].trim()
        const body = m1[2].trim()
        // Extrai subtópicos numerados do body: "1. xxx 2. xxx"
        const subs = []
        const subRx = /\d+[\.\d]*\.\s+([^\.]{5,80}?)(?=\s+\d+[\.\d]*\.|$)/g
        let sm
        while ((sm = subRx.exec(body)) !== null) {
          subs.push(sm[1].trim())
          if (subs.length >= 15) break
        }
        const diff = getDiff(name)
        const hrs = Math.max(2, Math.min(12, Math.round(subs.length * 0.6) + 2))
        topics.push({
          title: name,
          subtitle: body.slice(0, 80) + (body.length > 80 ? '...' : ''),
          weight: getWeight(name),
          difficulty: diff,
          estimated_hours: hrs,
          subtopics: subs,
          status: 'pending',
          order_idx: topics.length + 1,
        })
        continue
      }

      // Padrão 2: nome sozinho na linha, conteúdo na próxima
      if (standaloneRx.test(line) && line.length < 60 && !line.includes('.')) {
        const nextLine = lines[i + 1] || ''
        if (nextLine.length > 30 || nextLine.match(/^\d+\./)) {
          const subs = []
          const subRx = /\d+[\.\d]*\.\s+([^\.]{5,80}?)(?=\s+\d+[\.\d]*\.|$)/g
          let sm
          while ((sm = subRx.exec(nextLine)) !== null) {
            subs.push(sm[1].trim())
            if (subs.length >= 15) break
          }
          const diff = getDiff(line)
          topics.push({
            title: line.trim(),
            subtitle: nextLine.slice(0, 80) + (nextLine.length > 80 ? '...' : ''),
            weight: getWeight(line),
            difficulty: diff,
            estimated_hours: Math.max(2, Math.min(12, Math.round(subs.length * 0.6) + 2)),
            subtopics: subs,
            status: 'pending',
            order_idx: topics.length + 1,
          })
          i++ // pula a próxima linha (já usada como subtitle)
        }
      }
    }
  } else {
    // Modo livre / guideline / apostila
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const headRx = /^(cap[ií]tulo|chapter|seção|section|parte|módulo|unidade|\d+[\.\-\)])\s+(.+)/i
    let current = null
    for (const line of lines) {
      if (line.length < 4 || line.length > 120) continue
      const mH = line.match(headRx)
      if (mH) {
        current = { title: toTitle(mH[2] || line), subtitle: '', weight: 10, difficulty: 'medium', estimated_hours: 2, subtopics: [], status: 'pending', order_idx: topics.length + 1 }
        topics.push(current)
      } else if (current && !current.subtitle && line.length > 15) {
        current.subtitle = line.slice(0, 80)
      }
    }
    if (topics.length < 2) {
      text.split(/\n{2,}/).filter(c => c.trim().length > 20).slice(0, 25).forEach((chunk, i) => {
        const first = chunk.split('\n')[0].trim().slice(0, 80)
        topics.push({ title: first || `Tópico ${i + 1}`, subtitle: '', weight: 10, difficulty: 'medium', estimated_hours: 2, subtopics: [], status: 'pending', order_idx: i + 1 })
      })
    }
  }

  return topics.slice(0, 50)
}

function getDiff(name) {
  const n = name.toLowerCase()
  if (/contabilidade|tributár|fiscal|aduaneira|auditoria|econom|estatíst|financ|previdenc/.test(n)) return 'hard'
  if (/portugu|inglês|administraç|gestão|noção|básic|introduç/.test(n)) return 'easy'
  return 'medium'
}

function getWeight(name) {
  const n = name.toLowerCase()
  if (/contabilidade|tributár|fiscal|direito|legislaç/.test(n)) return 18
  if (/econom|aduaneira|auditoria/.test(n)) return 15
  if (/administraç|gestão|estatíst/.test(n)) return 12
  return 10
}

function toTitle(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()
}

// ─────────────────────────────────────────────────────────────────────
export default function ImportPage({ data, notify, onRefresh, onNavigate }) {
  const [step, setStep] = useState('input')
  const [text, setText] = useState('')
  const [mode, setMode] = useState('edital')
  const [topics, setTopics] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [targetOrbitId, setTargetOrbitId] = useState(data.orbits[0]?.id || 'new')
  const [newOrbitName, setNewOrbitName] = useState('')
  const [newOrbitColor, setNewOrbitColor] = useState('#b5813a')
  const [newOrbitIcon, setNewOrbitIcon] = useState('orbit-rings')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setText(ev.target.result || '')
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleParse = () => {
    if (!text.trim()) { setError('Cole ou carregue o texto do documento.'); return }
    setError('')
    const parsed = parseText(text, mode)
    if (parsed.length === 0) { setError('Não foi possível identificar tópicos. Tente outro modo ou ajuste o texto.'); return }
    setTopics(parsed)
    setSelected(new Set(parsed.map((_, i) => i)))
    setStep('result')
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setLoading(true)
    setError('')
    try {
      let orbitId = targetOrbitId
      if (targetOrbitId === 'new') {
        const { data: newOrbit, error: err } = await createOrbit({ name: newOrbitName || 'Nova Órbita', description: '', color: newOrbitColor, icon: newOrbitIcon, priority: 2, weekly_hours_goal: 6 })
        if (err) throw new Error(err.message)
        orbitId = newOrbit.id
      }
      const toImport = topics.filter((_, i) => selected.has(i)).map((t, i) => ({ ...t, orbit_id: orbitId, order_idx: i + 1 }))
      const { error: err2 } = await bulkCreateTopics(toImport)
      if (err2) throw new Error(err2.message)
      notify(`${toImport.length} tópicos importados!`)
      onRefresh()
      setStep('done')
    } catch (err) {
      setError('Erro: ' + err.message)
    }
    setLoading(false)
  }

  const toggle = i => setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })
  const toggleAll = () => setSelected(selected.size === topics.length ? new Set() : new Set(topics.map((_, i) => i)))
  const deleteTopic = i => {
    setTopics(prev => prev.filter((_, idx) => idx !== i))
    setSelected(prev => {
      const s = new Set()
      prev.forEach(idx => { if (idx < i) s.add(idx); else if (idx > i) s.add(idx - 1) })
      return s
    })
  }

  const dc = { easy: '#4a7c59', medium: '#b5813a', hard: '#c47a5a' }
  const dl = { easy: 'fácil', medium: 'médio', hard: 'difícil' }
  const COLORS = ['#b5813a', '#4a7c59', '#3a6a7a', '#7a5a8a', '#c47a5a', '#3a5a7a', '#6a7a3a']

  return (
    <div>
      <div style={s.topbar}>
        <div style={s.topbarTitle}>Importar conteúdo</div>
        <div style={s.topbarSub}>Cole o texto do edital, guideline ou apostila — extração automática de tópicos, sem custo</div>
      </div>
      <div style={s.content}>
        {error && <div style={s.errorBox}>{error}</div>}

        {step === 'input' && (
          <div>
            <div style={s.modeRow}>
              {[
                { id: 'edital', label: 'Edital de concurso' },
                { id: 'guideline', label: 'Guideline / artigo' },
                { id: 'apostila', label: 'Apostila' },
                { id: 'livre', label: 'Documento livre' },
              ].map(m => (
                <button key={m.id} style={{ ...s.modeBtn, ...(mode === m.id ? s.modeBtnActive : {}) }} onClick={() => setMode(m.id)}>{m.label}</button>
              ))}
            </div>

            <div style={s.textareaWrap}>
              <textarea
                style={s.textarea}
                placeholder={
                  mode === 'edital'
                    ? 'Cole aqui o texto do edital...\n\nDica: Abra o PDF → Cmd+A (selecionar tudo) → Cmd+C (copiar) → cole aqui.\n\nO parser vai identificar matérias e tópicos automaticamente.'
                    : 'Cole aqui o texto do documento...\n\nO parser vai extrair capítulos e tópicos automaticamente.'
                }
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div style={s.textareaFooter}>
                <span style={{ fontSize: 11, color: C.text3 }}>{text.length > 0 ? `${text.length.toLocaleString()} caracteres` : 'vazio'}</span>
                <label style={s.fileBtn}>
                  ↑ Carregar .txt
                  <input type="file" accept=".txt,.md" onChange={handleFile} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={s.tip}>
              <strong style={{ color: C.accent }}>Para PDFs:</strong> Abra o PDF no Mac → <kbd style={s.kbd}>Cmd+A</kbd> → <kbd style={s.kbd}>Cmd+C</kbd> → cole acima. Funciona com PDFs de texto puro. PDFs escaneados (foto) não têm texto selecionável.
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={s.label}>Adicionar à órbita</div>
                <select style={s.select} value={targetOrbitId} onChange={e => setTargetOrbitId(e.target.value)}>
                  <option value="new">+ Criar nova órbita</option>
                  {data.orbits.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {targetOrbitId === 'new' && (
                <div style={{ flex: 1 }}>
                  <div style={s.label}>Nome da nova órbita</div>
                  <input style={s.input} placeholder="ex: Concurso Fiscal 2025" value={newOrbitName} onChange={e => setNewOrbitName(e.target.value)} />
                </div>
              )}
            </div>

            {targetOrbitId === 'new' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newOrbitColor === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }} onClick={() => setNewOrbitColor(c)} />
                ))}
                <div style={{ width: 1, height: 18, background: C.border, margin: '0 4px' }} />
                {ORBIT_ICONS.slice(0, 8).map(ic => (
                  <button key={ic.id} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${newOrbitIcon === ic.id ? newOrbitColor + '88' : C.border}`, borderRadius: 7, background: newOrbitIcon === ic.id ? newOrbitColor + '18' : 'none', cursor: 'pointer' }} onClick={() => setNewOrbitIcon(ic.id)} title={ic.label}>
                    <OrbitIcon id={ic.id} size={16} color={newOrbitColor} />
                  </button>
                ))}
              </div>
            )}

            <button style={s.primaryBtn} onClick={handleParse}>Extrair tópicos →</button>
          </div>
        )}

        {step === 'result' && (
          <div>
            <div style={s.resultHeader}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: C.text }}>{topics.length} tópicos identificados</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button style={s.selectAllBtn} onClick={toggleAll}>{selected.size === topics.length ? 'Desmarcar todos' : 'Selecionar todos'}</button>
                <button style={s.backBtn} onClick={() => setStep('input')}>← Editar</button>
              </div>
            </div>

            <div style={s.topicList}>
              {topics.map((t, i) => (
                <div key={i} style={{ ...s.topicCard, opacity: selected.has(i) ? 1 : 0.4, borderColor: selected.has(i) ? 'rgba(181,129,58,0.22)' : C.border }} onClick={() => toggle(i)}>
                  <div style={{ ...s.check, background: selected.has(i) ? C.accent : 'transparent' }}>
                    {selected.has(i) && <span style={{ color: '#0d0d0b', fontSize: 10 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.topicTitle}>{t.title}</div>
                    {t.subtitle && <div style={s.topicSub}>{t.subtitle}</div>}
                    {t.subtopics.length > 0 && (
                      <div style={s.subtopicsRow}>
                        {t.subtopics.slice(0, 4).map((st, j) => <span key={j} style={s.subtopicTag}>{st}</span>)}
                        {t.subtopics.length > 4 && <span style={s.subtopicTag}>+{t.subtopics.length - 4}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 10.5, color: dc[t.difficulty] }}>{dl[t.difficulty]}</span>
                    <span style={{ fontSize: 10.5, color: C.text3 }}>{t.estimated_hours}h</span>
                    <span style={{ fontSize: 10.5, color: C.text3, fontFamily: 'monospace' }}>p{t.weight}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTopic(i) }}
                      style={{ marginTop: 4, fontSize: 10, color: C.text3, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                      title="Remover"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            <button style={{ ...s.primaryBtn, opacity: selected.size === 0 || loading ? 0.5 : 1 }} onClick={handleImport} disabled={selected.size === 0 || loading}>
              {loading ? 'Importando...' : `Importar ${selected.size} tópicos →`}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div style={s.doneWrap}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a7c59' }} />
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, color: C.text }}>Importação concluída</div>
            <div style={{ fontSize: 13, color: C.text3, maxWidth: 340, lineHeight: 1.6 }}>Tópicos adicionados. O ciclo adaptativo já considera o novo conteúdo.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={s.primaryBtn} onClick={() => onNavigate('orbitas')}>Ver órbitas →</button>
              <button style={s.backBtn} onClick={() => { setStep('input'); setText(''); setTopics([]) }}>Importar outro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const C = { bg2: '#131310', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }
const s = {
  topbar: { padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 },
  topbarTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text },
  topbarSub: { fontSize: 12, color: C.text3, marginTop: 3 },
  content: { padding: '24px 32px', maxWidth: 720 },
  errorBox: { padding: '12px 16px', background: 'rgba(196,122,90,0.1)', border: '1px solid rgba(196,122,90,0.25)', borderRadius: 8, fontSize: 13, color: '#c47a5a', marginBottom: 18 },
  modeRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  modeBtn: { padding: '6px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 99, color: C.text3, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif", transition: 'all 0.13s' },
  modeBtnActive: { borderColor: 'rgba(181,129,58,0.4)', color: C.accent, background: 'rgba(181,129,58,0.07)' },
  textareaWrap: { border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.bg2, marginBottom: 14 },
  textarea: { width: '100%', minHeight: 200, padding: '16px', background: 'transparent', border: 'none', color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  textareaFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderTop: `1px solid ${C.border}` },
  fileBtn: { fontSize: 12, color: C.accent, cursor: 'pointer', padding: '4px 10px', border: `1px solid rgba(181,129,58,0.25)`, borderRadius: 6 },
  tip: { fontSize: 12, color: C.text3, lineHeight: 1.7, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8 },
  kbd: { display: 'inline-block', padding: '1px 5px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: C.text2 },
  label: { fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  select: { width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none' },
  input: { width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none', boxSizing: 'border-box' },
  primaryBtn: { marginTop: 20, padding: '10px 24px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  selectAllBtn: { fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  backBtn: { padding: '6px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  topicList: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 },
  topicCard: { display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 14px', borderRadius: 10, border: '1px solid', background: C.bg2, cursor: 'pointer', transition: 'all 0.12s' },
  check: { width: 17, height: 17, borderRadius: '50%', border: '1px solid rgba(181,129,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  topicTitle: { fontSize: 13.5, color: C.text, fontWeight: 500 },
  topicSub: { fontSize: 11.5, color: C.text3, marginTop: 2 },
  subtopicsRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  subtopicTag: { fontSize: 10.5, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.text3 },
  doneWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '70px 32px', textAlign: 'center' },
}
