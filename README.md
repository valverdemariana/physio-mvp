# Physio MVP — Controle de Pacientes (Fisioterapia)

Este repositório contém um **MVP completo** (backend + frontend) para clínica de fisioterapia.

## Stack
- **Backend (API):** Node.js + Express + TypeScript + Prisma + PostgreSQL + JWT
- **Frontend (Web):** Next.js (App Router) + TypeScript
- **Banco:** PostgreSQL (Docker)

## O que está implementado (conforme seu backlog)
### Ciclo 1
- Setup do projeto (repo, .env, postgres, migrations, docker dev)
- Autenticação + usuários (JWT, roles Admin/Fisio/Recepção, proteção por permissões)
- CRUD Pacientes (listar/buscar/criar/editar/inativar, filtros)
- Plano de Tratamento (editar no perfil do paciente, histórico de versões)
- Sessões (agendar, atualizar status, finalizar com evolução/dor/condutas, histórico)

### Ciclo 2
- Agenda do dia (lista, filtros, ações rápidas)
- Dashboard executivo (cards + gráfico simples)
- Regras/validações (sessão realizada exige dor ou evolução; auditoria básica; logs de status)
- Base pronta para deploy (backend + frontend)

---

## 1) Rodar localmente (Windows/Mac/Linux)
### Pré-requisitos
- Docker Desktop
- Node.js 20+ (recomendado)

### Passo a passo
1. **Suba o banco**
   ```bash
   docker compose up -d
   ```

2. **Backend (API)**
   ```bash
   cd apps/api
   cp .env.example .env
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
   A API sobe em: `http://localhost:4000`

3. **Frontend (Web)**
   Em outro terminal:
   ```bash
   cd apps/web
   cp .env.example .env.local
   npm install
   npm run dev
   ```
   O web app sobe em: `http://localhost:3000`

---

## 2) Logins iniciais
Após rodar o seed (`npm run db:seed`), você terá:

- **Admin 1**: `admin1@clinic.local` / `Admin123!`
- **Admin 2**: `admin2@clinic.local` / `Admin123!`
- **Usuário (Fisio)**: `fisio@clinic.local` / `User123!`

> Troque as senhas em produção.

---

## 3) Deploy (produção) — sugestão de caminho gratuito/baixo custo
### Banco
- Recomendado: Supabase (Postgres gerenciado) ou Neon.

### Backend
- Render (free tier costuma ser suficiente para MVP), Railway, Fly.io.

### Frontend
- Vercel (Next.js).

### Checklist
1. Criar banco Postgres gerenciado
2. Configurar variáveis de ambiente do backend (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
3. Rodar migrations em produção
4. Rodar seed (ou criar admins via endpoint protegido)
5. Subir backend
6. Configurar `NEXT_PUBLIC_API_URL` no Vercel
7. Testar login, pacientes, sessões, dashboard, agenda

---

## 4) Scripts úteis
### API
- `npm run dev` — dev
- `npm run build && npm start` — produção
- `npm run db:migrate` — migrations
- `npm run db:seed` — cria usuários iniciais

---

## 5) Observações
- Recuperação de senha por e-mail está como **stub** (endpoint pronto para integrar com SMTP/Resend). 
- Permissões: Admin (tudo), Fisio (pacientes/sessões), Recepção (agenda/sessões sem evolução).

