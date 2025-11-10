# Legal AI Assistant

End-to-end skeleton for the Legal AI Assistant MVP described in the PRD. Репозиторий включает единый Vercel‑совместимый стек: серверлесс-бэкенд на TypeScript с Supabase + OpenAI и React/Vite фронтенд с Tailwind.

## Project Structure

- `backend-ts/` — TypeScript serverless backend (Vercel functions) with Supabase + OpenAI integration.
- `frontend/` — Vite React application with legal chat UI components and streaming client.
- `docs/` — Architecture notes and design references.

## Getting Started

### Install & Dev

```bash
npm install               # устанавливает зависимости workspaces (frontend + backend-ts)
cp backend-ts/env.example backend-ts/.env.local
cp frontend/env.example frontend/.env.local
npm run dev               # vercel dev: фронт доступен на 5173, API на http://localhost:3000/api
```

- **Backend secrets** (`APP_*`) задаются в `backend-ts/.env.local` или в Vercel Project Settings.
- **Frontend env** (`VITE_*`) — в `frontend/.env.local`. По умолчанию `VITE_API_BASE_URL=/api`, поэтому в продакшене фронт обращается к тому же домену.

## Key Features

- **Case management** — Sidebar groups chats and document context per legal case.
- **Document awareness** — Document panel surfaces uploaded materials per case; backend ready for text extraction and embeddings.
- **Streaming chats** — Real-time assistant responses with Markdown rendering and sanitisation.
- **RAG-ready backend** — Supabase wrappers and message service prepared for embeddings + OpenAI reasoning flow.
- **Интеллектуальный парсинг документов** — Автоматическое извлечение текста из PDF/DOCX/TXT и анализ изображений напрямую через GPT-vision.
- **Метапромпт бюро** — Встроенный системный промпт для модели GPT-5 mini отражает позиционирование АБ «Немовы и партнёры».

## Deployment

- Следуйте `docs/deployment.md` — один проект Vercel обслуживает и фронт, и API.
- В Vercel пропишите `APP_*` секреты для серверлесс-функции и `VITE_*` переменные для фронтенда.
- Supabase ключи и OpenAI API держите только на серверной стороне.

## Next Steps

- Implement document preprocessing and embedding pipelines (Supabase Functions or Celery workers).
- Add authentication via Supabase Auth and enforce row-level security.
- Introduce collaborative features (shared cases, realtime updates).
- Expand test coverage (Pytest for services, React Testing Library for UI).

