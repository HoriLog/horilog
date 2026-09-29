# Horizonte ERP — Logística Integrada

## Stack
- Vite + React 19 + TypeScript (strict mode) + Tailwind CSS
- Supabase (Postgres + Auth + Realtime)
- Deploy: Vercel (frontend) + Vercel Functions (middleware futuro)
- Ambiente: Windows, PowerShell, VS Code / Cursor, porta 3000

## Estrutura de pastas
- `src/types.ts` → contratos de dados (fonte da verdade dos tipos)
- `src/services/api/` → funções de acesso ao Supabase
- `src/hooks/` → hooks React por módulo
- `src/components/` → componentes de UI
- `src/components/auth/LoginScreen.tsx` → autenticação Supabase

## Módulos e status
- ✅ Auth → Supabase Auth funcionando, 3 perfis (analista, supervisor, gerencia)
- ✅ Frota (veículos) → migrado para Supabase com Realtime
- ✅ Equipes (team_members) → migrado para Supabase
- ⏳ Monitoramento → ainda em mock, próximo a migrar
- 🗄️ 5 telas órfãs → não navegáveis (ArmazemWMS, Configuracoes, Faturamento, RastreamentoTMS, RemessasPedidos)

## Perfis de acesso
- `analista` → operacional
- `supervisor` → operacional + aprovações
- `gerencia` → visão completa (cascata: gerencia > supervisor > analista)

## Infraestrutura
- Supabase: Postgres + Auth + Realtime + Storage
- Frontend: Vercel
- Middleware futuro: Vercel Functions (lógica de servidor, integrações externas)
- Docker Compose local para desenvolvimento

## Convenções obrigatórias
- TypeScript strict — sem `any`
- Campos ausentes → `null | undefined` no tipo, "Não informado" / "Sem dado" na UI
- Nunca usar mock data hardcoded
- Canal Supabase Realtime → nome único por assinatura (nunca fixo)
- `npm install` usa `--legacy-peer-deps`
- Respostas sempre em português
- Honestidade sobre dados: nunca inventar valores ausentes

## Padrão de migração de módulos
Cada módulo segue a estrutura:
1. `src/services/api/[modulo].ts` → funções CRUD no Supabase
2. `src/hooks/use[Modulo].ts` → hook React com estado e Realtime
3. Tela/componente consome o hook, nunca acessa Supabase diretamente
4. Referência de padrão: `useVehicles.ts` e `useTeamMembers.ts`