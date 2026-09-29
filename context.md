# Horizonte ERP — Contexto de Desenvolvimento

> Atualizar este arquivo sempre que um módulo for concluído ou uma decisão importante for tomada.

## Objetivo do sistema
Sistema de gestão logística para o Grupo Horizonte — substitui fluxos operacionais baseados em planilhas (Status_Entrega, Carta TML, Devolução) por uma plataforma centralizada com persistência real.

## Stack completa
- **Frontend:** Vite + React 19 + TypeScript strict + Tailwind CSS
- **Banco de dados:** Supabase (Postgres)
- **Autenticação:** Supabase Auth
- **Realtime:** Supabase Realtime (websockets)
- **Deploy frontend:** Vercel
- **Middleware/API customizada:** Vercel Functions (futuro)
- **Scripts ETL:** Python + openpyxl (extração de planilhas .xlsx)
- **Ambiente local:** Windows, PowerShell, Cursor, porta 3000

## Arquivos-chave
| Arquivo | Papel |
|---|---|
| `src/types.ts` | Contratos TypeScript — fonte da verdade |
| `src/services/api/vehicles.ts` | CRUD de veículos no Supabase |
| `src/services/api/teamMembers.ts` | CRUD de equipes no Supabase |
| `src/services/csvImport.ts` | Importação de CSV com validação |
| `src/hooks/useVehicles.ts` | Hook de veículos com Realtime |
| `src/hooks/useTeamMembers.ts` | Hook de equipes com Realtime |
| `src/components/auth/LoginScreen.tsx` | Tela de login Supabase |

## Status dos módulos
| Módulo | Status | Observação |
|---|---|---|
| Auth | ✅ Concluído | Supabase Auth, 3 perfis |
| Frota | ✅ Concluído | Supabase + Realtime validado |
| Equipes | ✅ Concluído | Supabase + Realtime validado |
| Monitoramento | ⏳ Pendente | Ainda em mock |
| TML | ⏳ Pendente | |
| Entregas | ⏳ Pendente | |
| Devolução | ⏳ Pendente | |
| Suporte | ⏳ Pendente | Formulário funcional, sem Supabase |
| 5 telas órfãs | 🗄️ Pausado | Decisão pendente (retomar ou remover) |

## Perfis de acesso (hierarquia em cascata)
- `gerencia` → acesso total
- `supervisor` → mesmo nível que gerência na prática
- `analista` → acesso operacional

## Decisões de arquitetura tomadas
- Supabase substitui localStorage e Postgres autogerenciado em VPS
- Vercel substitui servidor Node/Express dedicado para CRUD simples
- Servidor customizado (Vercel Functions) só para lógica que Supabase não resolve
- Multi-filial (múltiplas unidades) → desprioritizado, foco atual é autenticação e operação real
- Python fica isolado como scripts ETL, fora do serviço principal

## Padrão de migração (seguir sempre)
```
src/services/api/[modulo].ts   → funções CRUD no Supabase
src/hooks/use[Modulo].ts       → hook React com Realtime
Tela                           → consome o hook, nunca Supabase direto
```
Referência: `useVehicles.ts` + `vehicles.ts`

## Problemas conhecidos / lições aprendidas
- Auto Save desativado no editor causa divergência de arquivos — manter sempre ativado
- Nomes de pasta com erro de digitação quebram imports (ex: "auuth")
- Canal Supabase Realtime com nome fixo causa erro se dois componentes assinam ao mesmo tempo
- `npm install` requer `--legacy-peer-deps` (conflito vite/@vitejs/plugin-react/@tailwindcss)
- Ao reenviar arquivo com múltiplos módulos, revisar o arquivo completo antes — edições incrementais por trecho causaram regressão (veículos voltaram ao localStorage durante migração de Equipes)