# Legal AI Assistant

End-to-end skeleton for the Legal AI Assistant MVP described in the PRD. The repository contains a FastAPI backend with Supabase integrations and a React + Tailwind frontend that delivers the legal-focused chat UX.

## Project Structure

- `backend/` — FastAPI services, Supabase data access layer, and OpenAI streaming logic.
- `frontend/` — Vite React application with legal chat UI components and streaming client.
- `docs/` — Architecture notes and design references.

## Getting Started

### Backend

```bash
cd backend
poetry install
cp env.example .env
poetry run uvicorn app.main:app --reload
```

Configure your `.env` with Supabase credentials and the OpenAI API key. The backend exposes REST endpoints under `http://localhost:8000` for cases, chats, documents, and messages.

### Frontend

```bash
cd frontend
npm install
cp env.example .env.local
npm run dev
```

Configure `frontend/.env.local` (или переменные в Vercel) по образцу `env.example`:
- `VITE_API_BASE_URL` — URL FastAPI-бэкенда.
- `VITE_APP_ENV` — окружение (`local`, `staging`, `production`).
- `VITE_DEFAULT_USER_ID` — демо-пользователь для локальных тестов (может быть заменён на Supabase Auth ID).

### Document Processing Prerequisites

- Для OCR установите Tesseract (`brew install tesseract` / `sudo apt-get install tesseract-ocr` / Windows installer).
- При необходимости добавьте переменную окружения `TESSDATA_PREFIX`, если языковые модели Tesseract размещены нестандартно.

## Key Features

- **Case management** — Sidebar groups chats and document context per legal case.
- **Document awareness** — Document panel surfaces uploaded materials per case; backend ready for text extraction and embeddings.
- **Streaming chats** — Real-time assistant responses with Markdown rendering and sanitisation.
- **RAG-ready backend** — Supabase wrappers and message service prepared for embeddings + OpenAI reasoning flow.
- **Интеллектуальный парсинг документов** — Автоматическое извлечение текста из PDF, DOCX, TXT и изображений (OCR) с индексацией в Supabase `pgvector`.
- **Метапромпт бюро** — Встроенный системный промпт для модели GPT-5 mini отражает позиционирование АБ «Немовы и партнёры».

## Deployment

- Follow `docs/deployment.md` for GitHub publishing steps and Vercel deployment of the frontend.
- Supply `VITE_API_BASE_URL` on Vercel to point the UI at the hosted FastAPI backend.
- Secure backend secrets and Supabase credentials in your hosting platform before going live.

## Next Steps

- Implement document preprocessing and embedding pipelines (Supabase Functions or Celery workers).
- Add authentication via Supabase Auth and enforce row-level security.
- Introduce collaborative features (shared cases, realtime updates).
- Expand test coverage (Pytest for services, React Testing Library for UI).

