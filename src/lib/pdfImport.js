// PDF Import Engine
// Uses Claude API to extract structured study content from PDFs
// Supports: editais, guidelines, artigos, apostilas

/**
 * Extract text from PDF file using FileReader + pdfjs-based approach
 * For production: use a Cloudflare Worker to handle PDF parsing server-side
 */
export async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // Read as base64 for Claude API
        const base64 = e.target.result.split(',')[1]
        resolve({ base64, name: file.name, size: file.size })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze PDF content with Claude API
 * Returns structured study plan
 */
export async function analyzePdfWithAI({ base64, filename, orbitName, importMode }) {
  const modeInstructions = {
    edital: `Este é um EDITAL de concurso público. Extraia:
1. Nome do concurso, banca e data
2. TODAS as matérias com seus pesos (pontuação ou percentual)
3. Para cada matéria, liste TODOS os tópicos do programa detalhadamente
4. Identifique quais matérias têm maior peso relativo
5. Sugira uma ordem de estudo estratégica baseada no peso`,

    guideline: `Este é um GUIDELINE ou artigo médico/científico. Extraia:
1. Título e tema principal
2. Capítulos ou seções principais como tópicos de estudo
3. Conceitos-chave de cada seção
4. Hierarquia: capítulo → subcapítulo → conceito
5. Sugira divisão em sessões de 30-45 minutos`,

    apostila: `Esta é uma APOSTILA ou material de estudo. Extraia:
1. Tema geral e subtemas
2. Todos os capítulos como tópicos
3. Conceitos principais por capítulo
4. Exercícios ou aplicações se houver
5. Ordem natural de estudo`,

    livre: `Analise este documento e extraia:
1. Tema central
2. Estrutura hierárquica de conteúdo
3. Tópicos principais e subtópicos
4. Estimativa de complexidade por tópico
5. Sugestão de ordem de estudo`,
  }

  const prompt = `Analise este documento PDF e retorne um JSON estruturado para um app de estudos.

${modeInstructions[importMode] || modeInstructions.livre}

RETORNE APENAS JSON válido, sem markdown, sem explicações, com esta estrutura exata:
{
  "title": "nome do conteúdo",
  "type": "${importMode}",
  "summary": "resumo em 1-2 frases",
  "topics": [
    {
      "title": "nome do tópico",
      "subtitle": "breve descrição",
      "weight": 10,
      "difficulty": "easy|medium|hard",
      "estimated_hours": 2.5,
      "subtopics": ["subtópico 1", "subtópico 2"],
      "order_idx": 1
    }
  ],
  "total_hours": 45,
  "study_suggestion": "recomendação estratégica em 1 parágrafo",
  "orbit_name": "${orbitName || 'Nova Órbita'}"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            }
          },
          {
            type: 'text',
            text: prompt,
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.find(b => b.type === 'text')?.text || ''

  // Clean and parse JSON
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to extract JSON from text
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Resposta da IA não pôde ser interpretada como JSON')
  }
}

/**
 * Convert AI analysis result to Orbit topics format
 */
export function aiResultToTopics(analysis, orbitId) {
  if (!analysis?.topics?.length) return []

  return analysis.topics.map((t, i) => ({
    id: `imported-${Date.now()}-${i}`,
    orbit_id: orbitId,
    title: t.title,
    subtitle: t.subtitle || '',
    weight: Math.max(1, Math.min(30, t.weight || 10)),
    difficulty: ['easy', 'medium', 'hard'].includes(t.difficulty) ? t.difficulty : 'medium',
    estimated_hours: t.estimated_hours || 2,
    subtopics: t.subtopics || [],
    status: 'pending',
    order_idx: t.order_idx || i + 1,
    created_at: new Date().toISOString(),
  }))
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
