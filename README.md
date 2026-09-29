# Horizonte Logística — ERP / Torre de Controle

Sistema de gestão logística (frota, equipes, entregas, TML, devoluções) para
a operação Horizonte. Frontend em React + TypeScript + Vite + Tailwind.

## Rodando localmente

**Pré-requisitos:** Node.js 18+

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:3000)
npm run build    # checagem de tipos (tsc) + build de produção
npm run preview  # serve o build de produção localmente
```

## Dados

Hoje os dados operacionais (frota, equipes, entregas, TML, devoluções,
manutenção) ficam em `localStorage`, populados via importação de CSV/backup
JSON (menu "Dados" no cabeçalho). Não há backend ainda — é o próximo passo
natural quando a operação precisar de dados compartilhados entre usuários/
dispositivos.
