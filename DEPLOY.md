# Orbit — Guia de Deploy
## Stack: React 18 + Vite → GitHub → Cloudflare Pages + Supabase

---

## 1. Criar repositório no GitHub

1. Acesse github.com → New repository
2. Nome: `orbit`
3. Privado (recomendado)
4. Sem README (o projeto já tem estrutura)

---

## 2. Configurar Supabase

1. Acesse app.supabase.com
2. New project → anote o **Project ID** e **Anon Key**
3. Vá em **SQL Editor** → cole o conteúdo de `supabase-schema.sql` → Run
4. Confirme que as 4 tabelas foram criadas: orbits, topics, sessions, reviews

---

## 3. Configurar variáveis de ambiente (local)

Crie o arquivo `.env.local` na raiz do projeto:

```
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

---

## 4. Fazer upload pelo GitHub (iPad)

Como o projeto é grande demais para o editor do GitHub, use este método:

### Opção A — GitHub Desktop (recomendado no Mac)
- Clone o repo, copie os arquivos, commit e push

### Opção B — Upload via GitHub web (iPad)
Como você faz no Rastro:
1. Crie cada arquivo manualmente pela interface web do GitHub
2. Para arquivos grandes, o GitHub aceita upload via "Add file → Upload files"
3. Suba a estrutura de pastas src/ completa

### Opção C — Via terminal (se tiver acesso)
```bash
cd orbit
git init
git remote add origin https://github.com/SEU_USUARIO/orbit.git
git add .
git commit -m "feat: initial Orbit setup"
git push -u origin main
```

---

## 5. Configurar Cloudflare Pages

1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → selecione o repositório `orbit`
3. **Build settings:**
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: (deixar vazio)
4. **Environment variables** → Add:
   - `VITE_SUPABASE_URL` → sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` → sua anon key
5. Save and Deploy

---

## 6. Estrutura do projeto

```
orbit/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── supabase-schema.sql          ← rodar no Supabase SQL Editor
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── icons/
    │   └── OrbitIcon.jsx        ← 12 ícones SVG premium + app icon
    ├── lib/
    │   ├── supabase.js          ← cliente Supabase
    │   ├── db.js                ← camada de dados (Supabase + demo mode)
    │   ├── demo.js              ← dados demo + constantes
    │   ├── cycleEngine.js       ← algoritmo adaptativo + SM-2
    │   └── pdfImport.js         ← extração + análise via Claude API
    ├── components/
    │   └── Sidebar.jsx
    └── pages/
        ├── Dashboard.jsx
        ├── CicloPage.jsx        ← timer + ciclo adaptativo
        ├── ImportPage.jsx       ← importação de PDF com IA
        ├── OrbitasPage.jsx
        ├── RevisoesPage.jsx     ← revisão espaçada SM-2
        ├── MapaPage.jsx
        └── MetricasPage.jsx
```

---

## 7. Modo demonstração

Quando as variáveis de ambiente não estão configuradas, o app roda com
dados de demonstração pré-carregados. Tudo funciona normalmente —
criação de órbitas, sessões, revisões — mas os dados são só em memória.

Útil para testar o layout antes de conectar o Supabase.

---

## 8. Bump de versão (Cloudflare cache)

A cada deploy, incremente o `version` no `package.json`:
`"version": "1.0.1"` → `"version": "1.0.2"` etc.

---

## 9. Importação de PDF

A importação de PDF usa a **Claude API** diretamente do browser.
A API key já está configurada no ambiente do Claude.ai — sem custo extra.

Funcionalidades:
- Edital de concurso → matérias + pesos + todos os tópicos do programa
- Guideline médico → capítulos + conceitos por seção
- Apostila → estrutura navegável de capítulos
- Documento livre → extração automática de tópicos

---
## 10. Ícones de órbitas disponíveis (20 total)

**Orbital / Astronômico**
| ID           | Nome       | Conceito                   |
|--------------|------------|----------------------------|
| orbit-rings  | Órbita     | Círculo orbital assimétrico|
| arc-open     | Arco       | Aprendizado sem fim        |
| meridian     | Meridiano  | Precisão, navegação        |
| compass      | Bússola    | Direção, norte estratégico |

**Nós / Redes**
| ID            | Nome         | Conceito                 |
|---------------|--------------|--------------------------|
| node-cluster  | Nós          | Rede conectada           |
| constellation | Constelação  | Conhecimento distribuído |
| radial        | Radial       | Expansão orgânica        |
| branch        | Ramificação  | Crescimento hierárquico  |

**Fluxos / Movimento**
| ID        | Nome    | Conceito              |
|-----------|---------|-----------------------|
| wave-flow | Onda    | Fluxo contínuo        |
| helix     | Hélice  | Dupla perspectiva     |
| spiral    | Espiral | Crescimento orgânico  |
| loop-open | Loop    | Ciclo sem ponto final |

**Estrutura / Geometria**
| ID         | Nome     | Conceito                   |
|------------|----------|----------------------------|
| prism      | Prisma   | Refração, análise          |
| delta      | Delta    | Mudança, evolução          |
| diamond    | Diamante | Precisão, valor            |
| grid-break | Grade    | Pensamento lateral         |

**Profundidade / Camadas**
| ID       | Nome      | Conceito                     |
|----------|-----------|------------------------------|
| lens     | Lente     | Foco, visão ampliada         |
| strata   | Estratos  | Conhecimento acumulado       |
| parallax | Paralaxe  | Múltiplos planos simultâneos |
| anchor   | Âncora    | Base sólida, comprometimento |

Para adicionar mais ícones: edite `src/icons/OrbitIcon.jsx` (novo entry no objeto `icons`) e `src/lib/demo.js` (nova entrada no array `ORBIT_ICONS`). O picker de ícones no modal de nova órbita atualiza automaticamente.
