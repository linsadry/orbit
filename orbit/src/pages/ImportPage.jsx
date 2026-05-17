import { useState, useCallback } from 'react'
import { extractPdfText, analyzePdfWithAI, aiResultToTopics, formatFileSize } from '../lib/pdfImport.js'
import { bulkCreateTopics, createOrbit } from '../lib/db.js'
import { OrbitIcon } from '../icons/OrbitIcon.jsx'
import { ORBIT_ICONS } from '../lib/demo.js'

const IMPORT_MODES = [
  { id: 'edital', label: 'Edital de concurso', desc: 'Extrai matérias, pesos e todos os tópicos do programa' },
  { id: 'guideline', label: 'Guideline / artigo médico', desc: 'Organiza capítulos e conceitos para estudo clínico' },
  { id: 'apostila', label: 'Apostila / material de estudo', desc: 'Estrutura capítulos em sessões de estudo' },
  { id: 'livre', label: 'Documento livre', desc: 'Análise geral e extração de tópicos' },
]

export default function ImportPage({ data, notify, onRefresh, onNavigate }) {
  const [step, setStep] = useState('upload') // upload | mode | config | analyzing | result | done
  const [file, setFile] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [importMode, setImportMode] = useState('edital')
  const [targetOrbitId, setTargetOrbitId] = useState('new')
  const [newOrbitName, setNewOrbitName] = useState('')
  const [newOrbitColor, setNewOrbitColor] = useState('#b5813a')
  const [newOrbitIcon, setNewOrbitIcon] = useState('orbit-rings')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (!dropped || dropped.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF.')
      return
    }
    setFile(dropped)
    setError('')
    try {
      const fd = await extractPdfText(dropped)
      setFileData(fd)
      setStep('mode')
    } catch (err) {
      setError('Erro ao ler o arquivo: ' + err.message)
    }
  }, [])

  const handleAnalyze = async () => {
    if (!fileData) return
    setLoading(true)
    setStep('analyzing')
    setError('')
    try {
      const orbitName = targetOrbitId === 'new'
        ? newOrbitName || 'Nova Órbita'
        : data.orbits.find(o => o.id === targetOrbitId)?.name || 'Órbita'

      const result = await analyzePdfWithAI({
        base64: fileData.base64,
        filename: file.name,
        orbitName,
        importMode,
      })
      setAnalysis(result)
      setSelectedTopics(result.topics.map((_, i) => i))
      setStep('result')
    } catch (err) {
      setError('Erro na análise: ' + err.message)
      setStep('mode')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!analysis) return
    setLoading(true)
    try {
      let orbitId = targetOrbitId

      if (targetOrbitId === 'new') {
        const { data: newOrbit, error: orbitErr } = await createOrbit({
          name: newOrbitName || analysis.orbit_name || 'Nova Órbita',
          description: analysis.summary || '',
          color: newOrbitColor,
          icon: newOrbitIcon,
          priority: 2,
          weekly_hours_goal: Math.ceil((analysis.total_hours || 40) / 12),
        })
        if (orbitErr) throw new Error(orbitErr.message)
        orbitId = newOrbit.id
      }

      const filteredTopics = analysis.topics
        .filter((_, i) => selectedTopics.includes(i))
        .map((t, i) => ({ ...t, order_idx: i + 1 }))

      const topics = aiResultToTopics(filteredTopics, orbitId)
      const { error: topicErr } = await bulkCreateTopics(topics)
      if (topicErr) throw new Error(topicErr.message)

      notify(`${topics.length} tópicos importados com sucesso!`)
      onRefresh()
      setStep('done')
    } catch (err) {
      setError('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTopic = (idx) => {
    setSelectedTopics(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  return (
    <div>
      <div style={s.topbar}>
        <div style={s.topbarTitle}>Importar PDF</div>
        <div style={s.topbarSub}>Edital · Guideline · Apostila · Documento livre</div>
      </div>

      <div style={s.content}>
        {/* Progress indicator */}
        <div style={s.progress}>
          {['Arquivo', 'Tipo', 'Órbita', 'Análise', 'Revisão'].map((label, i) => {
            const stepIdx = ['upload', 'mode', 'config', 'analyzing', 'result'].indexOf(step)
            return (
              <div key={label} style={s.progressItem}>
                <div style={{
                  ...s.progressDot,
                  background: i <= stepIdx ? '#b5813a' : 'rgba(255,255,255,0.1)',
                  boxShadow: i === stepIdx ? '0 0 10px rgba(181,129,58,0.4)' : 'none',
                }} />
                <span style={{ ...s.progressLabel, color: i <= stepIdx ? '#9e9a8e' : '#4e4a42' }}>{label}</span>
                {i < 4 && <div style={{ ...s.progressLine, background: i < stepIdx ? '#b5813a' : 'rgba(255,255,255,0.07)' }} />}
              </div>
            )
          })}
        </div>

        {error && (
          <div style={s.errorBox}>{error}</div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div
            style={s.dropzone}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div style={s.dropIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="6" width="24" height="30" rx="3" stroke="#b5813a" strokeWidth="1.5" opacity="0.6" />
                <path d="M14 14h12M14 19h12M14 24h8" stroke="#b5813a" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <path d="M28 6v8h6" stroke="#b5813a" strokeWidth="1.2" strokeLinejoin="round" opacity="0.6" />
              </svg>
            </div>
            <div style={s.dropTitle}>Arraste seu PDF aqui</div>
            <div style={s.dropSub}>ou clique para selecionar</div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleDrop}
              style={{ display: 'none' }}
              id="pdf-input"
            />
            <label htmlFor="pdf-input" style={s.dropBtn}>Selecionar arquivo</label>
          </div>
        )}

        {/* Step: Mode */}
        {step === 'mode' && file && (
          <div>
            <div style={s.fileCard}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 3h7l4 4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="#b5813a" strokeWidth="1.2" />
                <path d="M11 3v4h4" stroke="#b5813a" strokeWidth="1.2" />
              </svg>
              <span style={s.fileName}>{file.name}</span>
              <span style={s.fileSize}>{formatFileSize(file.size)}</span>
            </div>

            <div style={s.sectionLabel}>Que tipo de documento é este?</div>
            <div style={s.modeGrid}>
              {IMPORT_MODES.map(mode => (
                <button
                  key={mode.id}
                  style={{ ...s.modeCard, ...(importMode === mode.id ? s.modeCardActive : {}) }}
                  onClick={() => setImportMode(mode.id)}
                >
                  <div style={s.modeLabel}>{mode.label}</div>
                  <div style={s.modeDesc}>{mode.desc}</div>
                </button>
              ))}
            </div>

            <button style={s.nextBtn} onClick={() => setStep('config')}>
              Continuar →
            </button>
          </div>
        )}

        {/* Step: Config (orbit) */}
        {step === 'config' && (
          <div>
            <div style={s.sectionLabel}>Adicionar a qual órbita?</div>
            <div style={s.orbitOptions}>
              <button
                style={{ ...s.orbitOption, ...(targetOrbitId === 'new' ? s.orbitOptionActive : {}) }}
                onClick={() => setTargetOrbitId('new')}
              >
                <span style={s.orbitOptionPlus}>+</span>
                Criar nova órbita
              </button>
              {data.orbits.map(o => (
                <button
                  key={o.id}
                  style={{ ...s.orbitOption, ...(targetOrbitId === o.id ? s.orbitOptionActive : {}) }}
                  onClick={() => setTargetOrbitId(o.id)}
                >
                  <OrbitIcon id={o.icon} size={16} color={o.color} />
                  {o.name}
                </button>
              ))}
            </div>

            {targetOrbitId === 'new' && (
              <div style={s.newOrbitForm}>
                <div style={s.formField}>
                  <label style={s.formLabel}>Nome da órbita</label>
                  <input
                    style={s.textInput}
                    value={newOrbitName}
                    onChange={e => setNewOrbitName(e.target.value)}
                    placeholder="Ex: Concurso Fiscal 2025"
                  />
                </div>
                <div style={s.formField}>
                  <label style={s.formLabel}>Cor</label>
                  <div style={s.colorPicker}>
                    {['#b5813a', '#4a7c59', '#3a6a7a', '#7a5a8a', '#c47a5a', '#3a5a7a', '#6a7a3a'].map(c => (
                      <button
                        key={c}
                        style={{ ...s.colorDot, background: c, outline: newOrbitColor === c ? `2px solid ${c}` : 'none', outlineOffset: 3 }}
                        onClick={() => setNewOrbitColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div style={s.formField}>
                  <label style={s.formLabel}>Ícone</label>
                  <div style={s.iconPicker}>
                    {ORBIT_ICONS.map(icon => (
                      <button
                        key={icon.id}
                        style={{ ...s.iconPickerBtn, ...(newOrbitIcon === icon.id ? s.iconPickerActive : {}) }}
                        onClick={() => setNewOrbitIcon(icon.id)}
                        title={icon.label}
                      >
                        <OrbitIcon id={icon.id} size={18} color={newOrbitColor} strokeWidth={1.4} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={s.btnRow}>
              <button style={s.backBtn} onClick={() => setStep('mode')}>← Voltar</button>
              <button style={s.analyzeBtn} onClick={handleAnalyze}>
                Analisar com IA →
              </button>
            </div>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === 'analyzing' && (
          <div style={s.analyzingState}>
            <div style={s.analyzingOrbit}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 3s linear infinite' }}>
                <circle cx="24" cy="24" r="4" fill="#b5813a" />
                <ellipse cx="24" cy="24" rx="14" ry="5.5" stroke="#b5813a" strokeWidth="1.6" fill="none" opacity="0.65" transform="rotate(-18 24 24)" />
                <ellipse cx="24" cy="24" rx="20" ry="4.5" stroke="#b5813a" strokeWidth="1" fill="none" opacity="0.28" transform="rotate(28 24 24)" />
              </svg>
            </div>
            <div style={s.analyzingTitle}>Analisando documento</div>
            <div style={s.analyzingSub}>A IA está extraindo tópicos, pesos e estrutura de estudo...</div>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && analysis && (
          <div>
            <div style={s.resultHeader}>
              <div style={s.resultTitle}>{analysis.title}</div>
              <div style={s.resultSummary}>{analysis.summary}</div>
              {analysis.study_suggestion && (
                <div style={s.resultSuggestion}>
                  <span style={s.resultSuggestionIcon}>○</span>
                  {analysis.study_suggestion}
                </div>
              )}
              <div style={s.resultMeta}>
                {analysis.topics?.length} tópicos · {analysis.total_hours}h estimadas
              </div>
            </div>

            <div style={s.topicSelectHeader}>
              <div style={s.sectionLabel}>Tópicos extraídos</div>
              <button
                style={s.selectAllBtn}
                onClick={() => setSelectedTopics(
                  selectedTopics.length === analysis.topics.length
                    ? []
                    : analysis.topics.map((_, i) => i)
                )}
              >
                {selectedTopics.length === analysis.topics.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div style={s.topicList}>
              {analysis.topics.map((topic, i) => (
                <div
                  key={i}
                  style={{ ...s.topicCard, ...(selectedTopics.includes(i) ? s.topicCardSelected : s.topicCardUnselected) }}
                  onClick={() => toggleTopic(i)}
                >
                  <div style={{ ...s.topicCheck, background: selectedTopics.includes(i) ? '#b5813a' : 'transparent' }}>
                    {selectedTopics.includes(i) && <span style={{ color: '#0d0d0b', fontSize: 10 }}>✓</span>}
                  </div>
                  <div style={s.topicInfo}>
                    <div style={s.topicTitle}>{topic.title}</div>
                    {topic.subtitle && <div style={s.topicSub}>{topic.subtitle}</div>}
                    {topic.subtopics?.length > 0 && (
                      <div style={s.subtopics}>
                        {topic.subtopics.slice(0, 3).map((st, j) => (
                          <span key={j} style={s.subtopic}>{st}</span>
                        ))}
                        {topic.subtopics.length > 3 && (
                          <span style={s.subtopic}>+{topic.subtopics.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={s.topicMeta}>
                    <span style={{ ...s.diffTag, color: topic.difficulty === 'hard' ? '#c47a5a' : topic.difficulty === 'easy' ? '#4a7c59' : '#b5813a' }}>
                      {topic.difficulty === 'hard' ? 'difícil' : topic.difficulty === 'easy' ? 'fácil' : 'médio'}
                    </span>
                    <span style={s.topicHours}>{topic.estimated_hours}h</span>
                    <div style={s.weightBar}>
                      <div style={{ width: `${(topic.weight / 30) * 100}%`, height: '100%', background: '#b5813a', borderRadius: 99 }} />
                    </div>
                    <span style={s.topicWeight}>{topic.weight}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.btnRow}>
              <button style={s.backBtn} onClick={() => setStep('mode')}>← Refazer</button>
              <button
                style={{ ...s.analyzeBtn, opacity: selectedTopics.length === 0 || loading ? 0.5 : 1 }}
                onClick={handleImport}
                disabled={selectedTopics.length === 0 || loading}
              >
                {loading ? 'Importando...' : `Importar ${selectedTopics.length} tópicos →`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div style={s.doneState}>
            <div style={s.doneDot} />
            <div style={s.doneTitle}>Importação concluída</div>
            <div style={s.doneSub}>Os tópicos foram adicionados à sua órbita e o ciclo foi atualizado.</div>
            <div style={s.doneBtns}>
              <button style={s.doneBtn} onClick={() => onNavigate('orbitas')}>Ver órbitas →</button>
              <button style={s.doneBtnSecondary} onClick={() => { setStep('upload'); setFile(null); setAnalysis(null); }}>
                Importar outro
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const C = { bg2: '#131310', bg3: '#1a1a16', border: 'rgba(255,255,255,0.055)', text: '#e2ddd4', text2: '#9e9a8e', text3: '#4e4a42', accent: '#b5813a' }

const s = {
  topbar: { padding: '20px 32px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0d0d0b', zIndex: 10 },
  topbarTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text },
  topbarSub: { fontSize: 12, color: C.text3, marginTop: 3 },
  content: { padding: '28px 32px', maxWidth: 680 },
  progress: { display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 },
  progressItem: { display: 'flex', alignItems: 'center', gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, transition: 'all 0.3s' },
  progressLabel: { fontSize: 11, letterSpacing: 0.3 },
  progressLine: { width: 24, height: 1, margin: '0 6px', transition: 'background 0.3s' },
  errorBox: { padding: '12px 16px', background: 'rgba(196,122,90,0.1)', border: '1px solid rgba(196,122,90,0.25)', borderRadius: 8, fontSize: 13, color: '#c47a5a', marginBottom: 20 },
  dropzone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    padding: '60px 32px', border: '1px dashed rgba(181,129,58,0.25)', borderRadius: 16,
    background: 'rgba(181,129,58,0.03)', cursor: 'pointer', textAlign: 'center',
  },
  dropIcon: { opacity: 0.7 },
  dropTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text },
  dropSub: { fontSize: 13, color: C.text3 },
  dropBtn: {
    padding: '10px 24px', background: 'rgba(181,129,58,0.1)', border: '1px solid rgba(181,129,58,0.3)',
    borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer',
  },
  fileCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 24,
  },
  fileName: { flex: 1, fontSize: 13, color: C.text },
  fileSize: { fontSize: 11, color: C.text3 },
  sectionLabel: { fontSize: 10.5, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 },
  modeCard: {
    padding: '16px 18px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12,
    cursor: 'pointer', textAlign: 'left', fontFamily: "'Geist', system-ui, sans-serif", transition: 'all 0.15s',
  },
  modeCardActive: { border: '1px solid rgba(181,129,58,0.4)', background: 'rgba(181,129,58,0.06)' },
  modeLabel: { fontSize: 13.5, color: C.text, fontWeight: 500, marginBottom: 5 },
  modeDesc: { fontSize: 12, color: C.text3, lineHeight: 1.5 },
  nextBtn: { padding: '10px 24px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  orbitOptions: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  orbitOption: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
    cursor: 'pointer', color: C.text2, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", textAlign: 'left', transition: 'all 0.13s',
  },
  orbitOptionActive: { border: '1px solid rgba(181,129,58,0.35)', color: C.text },
  orbitOptionPlus: { fontSize: 18, color: C.text3, lineHeight: 1 },
  newOrbitForm: { padding: '20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 20 },
  formField: { marginBottom: 16 },
  formLabel: { display: 'block', fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  textInput: { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif", outline: 'none', boxSizing: 'border-box' },
  colorPicker: { display: 'flex', gap: 10 },
  colorDot: { width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'all 0.15s' },
  iconPicker: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  iconPickerBtn: { width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', transition: 'all 0.13s' },
  iconPickerActive: { border: '1px solid rgba(181,129,58,0.4)', background: 'rgba(181,129,58,0.08)' },
  btnRow: { display: 'flex', gap: 10 },
  backBtn: { padding: '10px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  analyzeBtn: { padding: '10px 24px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  analyzingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 32px', textAlign: 'center' },
  analyzingOrbit: {},
  analyzingTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text },
  analyzingSub: { fontSize: 13, color: C.text3 },
  resultHeader: { padding: '20px 24px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 24 },
  resultTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text, marginBottom: 6 },
  resultSummary: { fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 12 },
  resultSuggestion: { display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(181,129,58,0.05)', border: '1px solid rgba(181,129,58,0.15)', borderRadius: 8, fontSize: 12.5, color: C.text2, lineHeight: 1.6, marginBottom: 12 },
  resultSuggestionIcon: { color: C.accent, flexShrink: 0 },
  resultMeta: { fontSize: 12, color: C.text3 },
  topicSelectHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  selectAllBtn: { fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  topicList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  topicCard: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.13s' },
  topicCardSelected: { borderColor: 'rgba(181,129,58,0.25)', background: 'rgba(181,129,58,0.04)' },
  topicCardUnselected: { borderColor: C.border, background: C.bg2, opacity: 0.6 },
  topicCheck: { width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(181,129,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'background 0.15s' },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 13.5, color: C.text, fontWeight: 500 },
  topicSub: { fontSize: 11.5, color: C.text3, marginTop: 3 },
  subtopics: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  subtopic: { fontSize: 10.5, padding: '2px 8px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.text3 },
  topicMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, minWidth: 60 },
  diffTag: { fontSize: 10.5 },
  topicHours: { fontSize: 11, color: C.text3 },
  weightBar: { width: 48, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' },
  topicWeight: { fontSize: 10, color: C.text3 },
  doneState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 32px', textAlign: 'center' },
  doneDot: { width: 12, height: 12, borderRadius: '50%', background: '#4a7c59', boxShadow: '0 0 16px rgba(74,124,89,0.5)' },
  doneTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, color: C.text },
  doneSub: { fontSize: 13, color: C.text3, maxWidth: 360, lineHeight: 1.6 },
  doneBtns: { display: 'flex', gap: 10, marginTop: 8 },
  doneBtn: { padding: '10px 24px', background: 'rgba(181,129,58,0.12)', border: '1px solid rgba(181,129,58,0.3)', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
  doneBtnSecondary: { padding: '10px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif" },
}
